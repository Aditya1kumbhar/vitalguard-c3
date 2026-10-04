import re

def update_db_py():
    with open('backend/db.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Update record_alert
    content = re.sub(
        r'async def record_alert\(peak_accel: float, severity: str = "high"\) -> int:',
        r'async def record_alert(band_id: str, peak_accel: float, severity: str = "high") -> int:',
        content
    )
    content = re.sub(
        r'"INSERT INTO fall_alerts \(timestamp, peak_accel, severity\) VALUES \(\?, \?, \?\)",\s*\(\s*ts,\s*round\(val, 2\),\s*clean_severity\s*\)',
        r'"INSERT INTO fall_alerts (band_id, timestamp, peak_accel, severity) VALUES (?, ?, ?, ?)",\n            (band_id, ts, round(val, 2), clean_severity)',
        content
    )

    # Update get_recent_alerts
    content = re.sub(
        r'async def get_recent_alerts\(limit: int = 20\) -> list\[dict\]:',
        r'async def get_recent_alerts(band_id: str, limit: int = 20) -> list[dict]:',
        content
    )
    content = re.sub(
        r'"SELECT id, timestamp, peak_accel, severity, acknowledged FROM fall_alerts ORDER BY id DESC LIMIT \?",\s*\(\s*safe_limit,\s*\)',
        r'"SELECT id, timestamp, peak_accel, severity, acknowledged FROM fall_alerts WHERE band_id = ? ORDER BY id DESC LIMIT ?",\n            (band_id, safe_limit,)',
        content
    )

    # Update get_alert_by_id
    content = re.sub(
        r'async def get_alert_by_id\(alert_id: int\) -> Optional\[dict\]:',
        r'async def get_alert_by_id(band_id: str, alert_id: int) -> Optional[dict]:',
        content
    )
    content = re.sub(
        r'"SELECT id, timestamp, peak_accel, severity, acknowledged FROM fall_alerts WHERE id = \?",\s*\(\s*clean_id,\s*\)',
        r'"SELECT id, timestamp, peak_accel, severity, acknowledged FROM fall_alerts WHERE id = ? AND band_id = ?",\n            (clean_id, band_id,)',
        content
    )

    # Update acknowledge_alert
    content = re.sub(
        r'async def acknowledge_alert\(alert_id: int\) -> bool:',
        r'async def acknowledge_alert(band_id: str, alert_id: int) -> bool:',
        content
    )
    content = re.sub(
        r'"UPDATE fall_alerts SET acknowledged = 1 WHERE id = \?",\s*\(\s*clean_id,\s*\)',
        r'"UPDATE fall_alerts SET acknowledged = 1 WHERE id = ? AND band_id = ?",\n            (clean_id, band_id,)',
        content
    )

    # Update clear_all_alerts
    content = re.sub(
        r'async def clear_all_alerts\(\) -> int:',
        r'async def clear_all_alerts(band_id: str) -> int:',
        content
    )
    content = re.sub(
        r'"DELETE FROM fall_alerts"',
        r'"DELETE FROM fall_alerts WHERE band_id = ?", (band_id,)',
        content
    )

    with open('backend/db.py', 'w', encoding='utf-8') as f:
        f.write(content)

def update_main_py():
    with open('backend/main.py', 'r', encoding='utf-8') as f:
        content = f.read()

    # Update TelemetryBroadcaster
    broadcaster_replacement = """class TelemetryBroadcaster:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[TelemetryPacket]]] = {}
        self.fall_sequence_queue: "asyncio.Queue[tuple[str, TelemetryPacket]]" = asyncio.Queue()
        self._latest_packet: dict[str, TelemetryPacket] = {}
        self._task: Optional[asyncio.Task] = None

    def get_latest(self, band_id: str) -> TelemetryPacket:
        return self._latest_packet.get(band_id) or normal_packet()

    @property
    def subscriber_count(self) -> int:
        return sum(len(s) for s in self._subscribers.values())

    def register(self, band_id: str) -> asyncio.Queue[TelemetryPacket]:
        if band_id not in self._subscribers:
            self._subscribers[band_id] = set()
        client_queue: asyncio.Queue[TelemetryPacket] = asyncio.Queue(maxsize=30)
        self._subscribers[band_id].add(client_queue)
        return client_queue

    def unregister(self, band_id: str, client_queue: asyncio.Queue[TelemetryPacket]) -> None:
        if band_id in self._subscribers:
            self._subscribers[band_id].discard(client_queue)
            if not self._subscribers[band_id]:
                del self._subscribers[band_id]

    def broadcast(self, band_id: str, packet: TelemetryPacket) -> None:
        self._latest_packet[band_id] = packet
        if band_id in self._subscribers:
            for q in list(self._subscribers[band_id]):
                try:
                    q.put_nowait(packet)
                except asyncio.QueueFull:
                    try:
                        q.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                    try:
                        q.put_nowait(packet)
                    except asyncio.QueueFull:
                        pass

    async def _run_loop(self) -> None:
        while True:
            try:
                # We can broadcast to all active band_ids
                for band_id in list(self._subscribers.keys()):
                    packet = normal_packet()
                    self.broadcast(band_id, packet)
            except Exception:
                pass
            
            try:
                while not self.fall_sequence_queue.empty():
                    band_id, packet = self.fall_sequence_queue.get_nowait()
                    self.broadcast(band_id, packet)
            except Exception:
                pass
            
            await asyncio.sleep(1)

    def start(self) -> None:
        if self._task is None or self._task.done():
            self._task = asyncio.create_task(self._run_loop())

    def stop(self) -> None:
        if self._task and not self._task.done():
            self._task.cancel()"""

    # Regex to replace class TelemetryBroadcaster ... to `broadcaster = TelemetryBroadcaster()`
    content = re.sub(
        r'class TelemetryBroadcaster:.*?(?=broadcaster = TelemetryBroadcaster\(\))',
        broadcaster_replacement + '\n\n',
        content,
        flags=re.DOTALL
    )

    # Update websocket
    ws_replacement = """@app.websocket("/ws/telemetry")
async def telemetry_stream(websocket: WebSocket, token: str = Query(...)) -> None:
    try:
        guardian = await auth.get_current_guardian(token)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    band_id = guardian.get("band_id")
    if not band_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()
    client_queue = broadcaster.register(band_id)
    try:
        await websocket.send_text(broadcaster.get_latest(band_id).model_dump_json())
        while True:
            packet = await client_queue.get()
            await websocket.send_text(packet.model_dump_json())
    except (WebSocketDisconnect, ConnectionResetError, asyncio.CancelledError):
        return
    except Exception:
        return
    finally:
        broadcaster.unregister(band_id, client_queue)"""
    content = re.sub(
        r'@app\.websocket\("/ws/telemetry"\).*?(?=@app\.post\("/api/trigger-fall"\))',
        ws_replacement + '\n\n\n# ── Fall trigger (demo button) ───────────────────────────────────────\n',
        content,
        flags=re.DOTALL
    )
    
    # Update endpoints
    content = content.replace(
        'await broadcaster.fall_sequence_queue.put(stage_packet(0.3, False, "free_fall_dip"))',
        'await broadcaster.fall_sequence_queue.put((guardian["band_id"], stage_packet(0.3, False, "free_fall_dip")))'
    )
    content = content.replace(
        'await broadcaster.fall_sequence_queue.put(stage_packet(peak_accel, True, "impact_spike"))',
        'await broadcaster.fall_sequence_queue.put((guardian["band_id"], stage_packet(peak_accel, True, "impact_spike")))'
    )
    content = content.replace(
        'await broadcaster.fall_sequence_queue.put(stage_packet(1.0, False, "post_fall_stillness"))',
        'await broadcaster.fall_sequence_queue.put((guardian["band_id"], stage_packet(1.0, False, "post_fall_stillness")))'
    )
    content = content.replace(
        'alert_id = await record_alert(peak_accel=peak_accel, severity="high")',
        'alert_id = await record_alert(band_id=guardian["band_id"], peak_accel=peak_accel, severity="high")'
    )
    
    content = content.replace(
        'return await get_recent_alerts(limit)',
        'return await get_recent_alerts(band_id=guardian["band_id"], limit=limit)'
    )
    content = content.replace(
        'alert = await get_alert_by_id(alert_id)',
        'alert = await get_alert_by_id(band_id=guardian["band_id"], alert_id=alert_id)'
    )
    content = content.replace(
        'updated = await acknowledge_alert(alert_id)',
        'updated = await acknowledge_alert(band_id=guardian["band_id"], alert_id=alert_id)'
    )
    content = content.replace(
        'deleted_count = await clear_all_alerts()',
        'deleted_count = await clear_all_alerts(band_id=guardian["band_id"])'
    )
    
    with open('backend/main.py', 'w', encoding='utf-8') as f:
        f.write(content)

update_db_py()
update_main_py()
print("Updated backend successfully.")
