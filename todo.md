Project context:
Already had a fully working online emergency application. The backend and server logic are complete. I need you to implement the following client-side offline fallback features into the existing app:

1) SMS Fallback Module
Requirements:
When there is no internet connection, the app must automatically send an SMS.
SMS content must include: "I need emergency help" + latitude, longitude,timestamp.
SMS must be sent natively (Android: Java/Kotlin; Flutter: platform channel).
No backend involvement is needed for SMS. It must work fully offline on the device.

Implementation details:
Create a separate modular service: SmsFallbackService.
Integrate with a ConnectivityChecker that determines when internet is unavailable.
Add a user setting that allows enabling/disabling SMS fallback.

2) Bluetooth Mesh Broadcast Module
Requirements:
When both internet and GSM are unavailable, the app must broadcast an emergency packet via BLE.
The mesh must work completely serverless (local device-to-device relay).
Broadcast packet structure: UUID, event type, timestamp, location (if available), hash signature.
Use RSSI only for near/medium/far classification; no precise distance calculation.
Implement both broadcasting (advertising) and listening (scanning) modes.
Implementation details:
Create a dedicated service: BleMeshService.
Manage advertising and scanning loops.
Add a message deduplication mechanism (e.g., 30-second UUID cache).
When the device regains internet, forward the latest mesh-received emergency data to the backend.

3) Offline Store & Forward Mechanism
Requirements:
While offline, all emergency events (SMS fallback trigger, mesh broadcast, local logs) must be stored in a local database (Hive or SQLite).
When the device reconnects to the internet, these events must be uploaded to the server.

Implementation details:
Create a modular OfflineQueueService.
Implement retry logic for processing the queue.

4) Modularity & Architecture
Each feature must live in its own service; no tight coupling.
Put shared models under core/models.
Put shared utilities under core/utils.
Use dependency injection (GetIt / Provider / Riverpod).
The server integration already exists, so just connect to a postEmergency() function.

5) Security Requirements
Add HMAC integrity signatures to BLE messages (payload + timestamp).
SMS text must be concise and machine-readable.
Encrypt offline queue data using AES-256.
Expected output:

Service files
Function signatures
Flutter + Android Java platform channel implementations
Minimal working examples
Architecture consistent with dependency injection