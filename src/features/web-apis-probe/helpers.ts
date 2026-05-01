export type ApiId =
  | 'permissions'
  | 'geolocation'
  | 'media-devices'
  | 'webrtc'
  | 'speech'
  | 'clipboard'
  | 'notifications'
  | 'battery';

export type ProbeStatus = 'granted' | 'prompt' | 'denied' | 'idle' | 'ok' | 'unsupported';

export interface ApiCard {
  id: ApiId;
  label: string;
  status: ProbeStatus;
  result: string;
}

export interface PermissionEntry {
  name: string;
  state: 'granted' | 'prompt' | 'denied';
}

export interface PeerStat {
  id: string;
  rtt: number;
  jitter: number;
  packetsLost: number;
  bytesSent: number;
  bytesRecv: number;
}

export interface SpeechVoice {
  name: string;
  lang: string;
  default?: boolean;
}

export const apiCards: ReadonlyArray<ApiCard> = [
  {
    id: 'permissions',
    label: 'Permissions',
    status: 'ok',
    result: '{ "geolocation": "prompt", "notifications": "granted" }',
  },
  {
    id: 'geolocation',
    label: 'Geolocation',
    status: 'prompt',
    result: '— not yet probed —',
  },
  {
    id: 'media-devices',
    label: 'MediaDevices',
    status: 'ok',
    result: '{ "videoinput": 2, "audioinput": 1, "audiooutput": 2 }',
  },
  {
    id: 'webrtc',
    label: 'WebRTC',
    status: 'ok',
    result: '2 active peer connections',
  },
  {
    id: 'speech',
    label: 'Speech',
    status: 'ok',
    result: '5 voices available',
  },
  {
    id: 'clipboard',
    label: 'Clipboard',
    status: 'granted',
    result: 'navigator.clipboard available',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    status: 'granted',
    result: 'Notification.permission = granted',
  },
  {
    id: 'battery',
    label: 'Battery',
    status: 'ok',
    result: '{ "level": 0.78, "charging": true }',
  },
];

export const permissions: ReadonlyArray<PermissionEntry> = [
  { name: 'geolocation', state: 'prompt' },
  { name: 'notifications', state: 'granted' },
  { name: 'camera', state: 'prompt' },
  { name: 'microphone', state: 'denied' },
  { name: 'clipboard-read', state: 'granted' },
  { name: 'clipboard-write', state: 'granted' },
];

export const peers: ReadonlyArray<PeerStat> = [
  {
    id: 'peer-A',
    rtt: 38,
    jitter: 4,
    packetsLost: 2,
    bytesSent: 142000,
    bytesRecv: 96000,
  },
  {
    id: 'peer-B',
    rtt: 92,
    jitter: 12,
    packetsLost: 18,
    bytesSent: 78000,
    bytesRecv: 64000,
  },
];

export const voices: ReadonlyArray<SpeechVoice> = [
  { name: 'Samantha', lang: 'en-US', default: true },
  { name: 'Daniel', lang: 'en-GB' },
  { name: 'Yuna', lang: 'ko-KR' },
  { name: 'Otoya', lang: 'ja-JP' },
  { name: 'Anna', lang: 'de-DE' },
];

export interface ProbeEvent {
  id: string;
  api: ApiId;
  ts: string;
  message: string;
}

export const recentProbes: ReadonlyArray<ProbeEvent> = [
  { id: 'p1', api: 'permissions', ts: '14:02:11', message: 'queried 4 permissions' },
  { id: 'p2', api: 'media-devices', ts: '14:01:55', message: 'enumerated 5 devices' },
  { id: 'p3', api: 'speech', ts: '14:01:42', message: 'voices loaded' },
  { id: 'p4', api: 'webrtc', ts: '14:00:31', message: 'peer-A: RTT 38ms' },
  { id: 'p5', api: 'battery', ts: '13:58:03', message: 'level 0.78' },
  { id: 'p6', api: 'notifications', ts: '13:55:50', message: 'permission granted' },
  { id: 'p7', api: 'clipboard', ts: '13:55:21', message: 'read OK' },
  { id: 'p8', api: 'geolocation', ts: '13:54:09', message: 'prompt deferred' },
];
