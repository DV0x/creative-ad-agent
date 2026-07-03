Last login: Mon Mar 23 23:12:49 on ttys002
chakra@chakras-MacBook-Air creative_agent % npx wrangler tail creative-agent-production --format json
{
    "wallTime": 3931,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287799969,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 5718,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T28][alarm][enter] cid=campaign_mn3h3lj4i77lvx iter=2 gen=true cid=campaign_mn3h3lj4i77lvx sandbox=true agent=proc_1774287728681_3wnn4e ageSec=66 userId=user_3BLppu3EcwtUnIcOiLLtsbO7aFp wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T29][rpc][listProcesses.start] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T30][rpc][listProcesses.done] cid=campaign_mn3h3lj4i77lvx ms=118"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T31][alarm][agentCheck] cid=campaign_mn3h3lj4i77lvx alive=true status=running processCount=1"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T32][rpc][getProcessLogs.start] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T33][rpc][getProcessLogs.done] cid=campaign_mn3h3lj4i77lvx ms=19"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T34][alarm][containerLogs.noNew] cid=campaign_mn3h3lj4i77lvx totalLen=26029"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T35][rpc][readTurnResult.start] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T36][rpc][readTurnResult.error] cid=campaign_mn3h3lj4i77lvx ms=43 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T37][alarm][reschedule] cid=campaign_mn3h3lj4i77lvx nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T38][alarm][exit.ok] cid=campaign_mn3h3lj4i77lvx iter=2 ms=180"
            ],
            "level": "log",
            "timestamp": 1774287799941
        },
        {
            "message": [
                "[T39][ws][message] cid=campaign_mn3h3lj4i77lvx type=ping gen=true session=a1319160-9d36-40cf-aa10-a1c0b3dc9748"
            ],
            "level": "log",
            "timestamp": 1774287799941
        }
    ],
    "eventTimestamp": 1774287794513,
    "event": {
        "scheduledTime": "2026-03-23T17:43:19.940Z"
    }
}
{
    "wallTime": 276,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "responseStreamDisconnected",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287767912,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/ws?token=REDACTED.REDACTED.REDACTED",
            "method": "GET",
            "headers": {
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f3c12aed62ce7",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "connection": "Upgrade",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "origin": "https://app.creativemachines.xyz",
                "pragma": "no-cache",
                "sec-websocket-key": "REDACTED",
                "sec-websocket-version": "13",
                "upgrade": "websocket",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182",
                "x-user-id": "user_3BLppu3EcwtUnIcOiLLtsbO7aFp"
            },
            "cf": {
                "clientTcpRtt": 22,
                "requestHeaderNames": {},
                "httpProtocol": "HTTP/1.1",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "continent": "AS",
                "asn": 17754,
                "clientAcceptEncoding": "gzip, deflate, br",
                "verifiedBotCategory": "",
                "country": "IN",
                "isEUCountry": false,
                "region": "Andhra Pradesh",
                "tlsClientCiphersSha1": "sjHQ9cyeOA+o+dT1s6tzfcWAEcQ=",
                "tlsClientAuth": {
                    "certIssuerDNLegacy": "",
                    "certIssuerSKI": "",
                    "certSubjectDNRFC2253": "",
                    "certSubjectDNLegacy": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certSKI": "",
                    "certSerial": "",
                    "certIssuerDN": "",
                    "certVerified": "NONE",
                    "certNotAfter": "",
                    "certSubjectDN": "",
                    "certPresented": "0",
                    "certRevoked": "0",
                    "certIssuerSerial": "",
                    "certIssuerDNRFC2253": "",
                    "certFingerprintSHA1": ""
                },
                "tlsClientRandom": "hNPc5IjihnhY2DrwV3n0s/KUkz0echej4bFUwqsWu34=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "81174db818837919c554ee91b4bc6b20573cd02282fb83ab32f17d551bafbe13",
                    "clientHandshake": "f1d66c97c35c4417c49ad3e3e3df7bf77c57bfc390a274c1852f12da11eb282e",
                    "serverHandshake": "aa8ffc736298ca895b43eb2be4ea46dacf2696d94dde73c65d62a297737c9877",
                    "serverFinished": "be2592379d592bd4fd670c2d0b8a3433b748fe193572cb125115e03566a69169"
                },
                "tlsClientHelloLength": "1722",
                "colo": "HYD",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "edgeRequestKeepAliveStatus": 1,
                "requestPriority": "",
                "postalCode": "521178",
                "city": "Bhimavaram",
                "tlsVersion": "TLSv1.3",
                "regionCode": "AP",
                "asOrganization": "Excell Media Pvt Ltd",
                "tlsClientExtensionsSha1Le": "Kxq3IwMD9uveFnH5/PvpiWJPx50=",
                "tlsClientExtensionsSha1": "BK4jo7HsQaEDcpRWdR9HJg3OlLg=",
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        }
    }
}
{
    "wallTime": 10808,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T1][do][fetch] userId=user_3BLppu3EcwtUnIcOiLLtsbO7aFp path=/ws upgrade=websocket"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T2][session][restore.agentProcessId] processId=proc_1774287728681_3wnn4e"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T3][session][restore.found] session=a1319160-9d36-40cf-aa10-a1c0b3dc9748 campaign=campaign_mn3h3lj4i77lvx gen=true userId=user_3BLppu3EcwtUnIcOiLLtsbO7aFp"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T4][do][ws.accepted] cid=campaign_mn3h3lj4i77lvx wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T5][ws][message] cid=campaign_mn3h3lj4i77lvx type=subscribe gen=true session=a1319160-9d36-40cf-aa10-a1c0b3dc9748"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T6][handler][subscribe.enter] cid=campaign_mn3h3lj4i77lvx sessionId=a1319160-9d36-40cf-aa10-a1c0b3dc9748 lastEventId=0 hasEvents=false gen=true"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T7][handler][subscribe.doReset] cid=campaign_mn3h3lj4i77lvx reason=empty_event_buffer"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T8][handler][subscribe.d1Check] cid=campaign_mn3h3lj4i77lvx d1Status=generating campaignId=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T9][handler][subscribe.restartAlarm] cid=campaign_mn3h3lj4i77lvx reason=DO_reset_while_generating"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T10][handler][subscribe.restoredFromStorage] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287778951
        },
        {
            "message": [
                "[T11][handler][subscribe.replay] cid=campaign_mn3h3lj4i77lvx eventCount=0 lastEventId=0"
            ],
            "level": "log",
            "timestamp": 1774287778951
        }
    ],
    "eventTimestamp": 1774287769263,
    "event": {
        "scheduledTime": "2026-03-23T17:42:58.951Z"
    }
}
{
    "wallTime": 26703,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "canceled",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Processes listed\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_13aa0e24c1954e6f\",\"details\":\"1 processes\",\"timestamp\":\"2026-03-23T17:42:59.720Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287779720
        }
    ],
    "eventTimestamp": 1774287778964,
    "event": {
        "rpcMethod": "listProcesses"
    }
}
{
    "wallTime": 1,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "WS closed: session=a1319160-9d36-40cf-aa10-a1c0b3dc9748, code=1006, reason=WebSocket disconnected without sending Close frame."
            ],
            "level": "log",
            "timestamp": 1774287805658
        }
    ],
    "eventTimestamp": 1774287800210,
    "event": {
        "getWebSocketEvent": {
            "wasClean": false,
            "code": 1006,
            "webSocketEventType": "close"
        }
    }
}
{
    "wallTime": 5720,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "canceled",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Processes listed\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_13aa0e24c1954e6f\",\"details\":\"1 processes\",\"timestamp\":\"2026-03-23T17:43:19.954Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287799954
        }
    ],
    "eventTimestamp": 1774287794839,
    "event": {
        "rpcMethod": "listProcesses"
    }
}
{
    "wallTime": 4752,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T12][alarm][enter] cid=campaign_mn3h3lj4i77lvx iter=1 gen=true cid=campaign_mn3h3lj4i77lvx sandbox=false agent=proc_1774287728681_3wnn4e ageSec=55 userId=user_3BLppu3EcwtUnIcOiLLtsbO7aFp wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T13][alarm][sandbox.reconnect] cid=campaign_mn3h3lj4i77lvx sandboxId=user-user_3blppu3ecwtunicoilltsbo7afp-v2"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T14][alarm][sandbox.reconnected] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T15][rpc][listProcesses.start] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T16][rpc][listProcesses.done] cid=campaign_mn3h3lj4i77lvx ms=775"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T17][alarm][agentCheck] cid=campaign_mn3h3lj4i77lvx alive=true status=running processCount=1"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T18][rpc][getProcessLogs.start] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T19][rpc][getProcessLogs.done] cid=campaign_mn3h3lj4i77lvx ms=18"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T20][container][log.raw] cid=campaign_mn3h3lj4i77lvx line={\"type\":\"user\",\"message\":{\"role\":\"user\",\"content\":[{\"tool_use_id\":\"toolu_01WLzv1Pc8XBhoEExN6QFcaD\",\"type\":\"tool_result\",\"content\":[{\"type\":\"text\",\"tex"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T21][container][log] cid=campaign_mn3h3lj4i77lvx type=assistant subtype="
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T22][container][log] cid=campaign_mn3h3lj4i77lvx type=assistant subtype="
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T23][alarm][containerLogs] cid=campaign_mn3h3lj4i77lvx newBytes=26029 totalLines=19"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T24][rpc][readTurnResult.start] cid=campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T25][rpc][readTurnResult.error] cid=campaign_mn3h3lj4i77lvx ms=16 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T26][alarm][reschedule] cid=campaign_mn3h3lj4i77lvx nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774287789760
        },
        {
            "message": [
                "[T27][alarm][exit.ok] cid=campaign_mn3h3lj4i77lvx iter=1 ms=809"
            ],
            "level": "log",
            "timestamp": 1774287789760
        }
    ],
    "eventTimestamp": 1774287779760,
    "event": {
        "scheduledTime": "2026-03-23T17:43:09.760Z"
    }
}
{
    "wallTime": 15902,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "canceled",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287789755,
    "event": {
        "rpcMethod": "listProcesses"
    }
}
{
    "wallTime": 470,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "responseStreamDisconnected",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][ws_upgrade] method=GET"
            ],
            "level": "log",
            "timestamp": 1774287767723
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLppu3EcwtUnIcOiLLtsbO7aFp, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774287767894
        },
        {
            "message": [
                "[trace][worker][ws_auth] userId=user_3BLppu3EcwtUnIcOiLLtsbO7aFp tokenPresent=true"
            ],
            "level": "log",
            "timestamp": 1774287767894
        },
        {
            "message": [
                "[trace][worker][ws_forward] userId=user_3BLppu3EcwtUnIcOiLLtsbO7aFp"
            ],
            "level": "log",
            "timestamp": 1774287767894
        }
    ],
    "eventTimestamp": 1774287767614,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/ws?token=REDACTED.REDACTED.REDACTED",
            "method": "GET",
            "headers": {
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f3c12aed62ce7",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "connection": "Upgrade",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "origin": "https://app.creativemachines.xyz",
                "pragma": "no-cache",
                "sec-websocket-key": "REDACTED",
                "sec-websocket-version": "13",
                "upgrade": "websocket",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "clientTcpRtt": 22,
                "requestHeaderNames": {},
                "httpProtocol": "HTTP/1.1",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "continent": "AS",
                "asn": 17754,
                "clientAcceptEncoding": "gzip, deflate, br",
                "verifiedBotCategory": "",
                "country": "IN",
                "isEUCountry": false,
                "region": "Andhra Pradesh",
                "tlsClientCiphersSha1": "sjHQ9cyeOA+o+dT1s6tzfcWAEcQ=",
                "tlsClientAuth": {
                    "certIssuerDNLegacy": "",
                    "certIssuerSKI": "",
                    "certSubjectDNRFC2253": "",
                    "certSubjectDNLegacy": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certSKI": "",
                    "certSerial": "",
                    "certIssuerDN": "",
                    "certVerified": "NONE",
                    "certNotAfter": "",
                    "certSubjectDN": "",
                    "certPresented": "0",
                    "certRevoked": "0",
                    "certIssuerSerial": "",
                    "certIssuerDNRFC2253": "",
                    "certFingerprintSHA1": ""
                },
                "tlsClientRandom": "hNPc5IjihnhY2DrwV3n0s/KUkz0echej4bFUwqsWu34=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "81174db818837919c554ee91b4bc6b20573cd02282fb83ab32f17d551bafbe13",
                    "clientHandshake": "f1d66c97c35c4417c49ad3e3e3df7bf77c57bfc390a274c1852f12da11eb282e",
                    "serverHandshake": "aa8ffc736298ca895b43eb2be4ea46dacf2696d94dde73c65d62a297737c9877",
                    "serverFinished": "be2592379d592bd4fd670c2d0b8a3433b748fe193572cb125115e03566a69169"
                },
                "tlsClientHelloLength": "1722",
                "colo": "HYD",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "edgeRequestKeepAliveStatus": 1,
                "requestPriority": "",
                "postalCode": "521178",
                "city": "Bhimavaram",
                "tlsVersion": "TLSv1.3",
                "regionCode": "AP",
                "asOrganization": "Excell Media Pvt Ltd",
                "tlsClientExtensionsSha1Le": "Kxq3IwMD9uveFnH5/PvpiWJPx50=",
                "tlsClientExtensionsSha1": "BK4jo7HsQaEDcpRWdR9HJg3OlLg=",
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        }
    }
}
{
    "wallTime": 257,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287808619,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 28786,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "exception",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [
        {
            "stack": "    at Sandbox2.alarm (index.js:35841:28)",
            "name": "Error",
            "message": "Durable Object reset because its code was updated.",
            "timestamp": 1774287819551
        }
    ],
    "logs": [
        {
            "message": [
                "{\"level\":\"error\",\"msg\":\"Sandbox error\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_13aa0e24c1954e6f\",\"timestamp\":\"2026-03-23T17:43:39.551Z\",\"error\":{\"message\":\"Network connection lost.\",\"stack\":\"Error: Network connection lost.\",\"name\":\"Error\"}}"
            ],
            "level": "error",
            "timestamp": 1774287819551
        }
    ],
    "eventTimestamp": 1774287790151,
    "event": {
        "scheduledTime": "2026-03-23T17:43:10.765Z"
    }
}
{
    "wallTime": 789,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287819250,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 790,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287819251,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 20,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:43:40.092Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287820092
        }
    ],
    "eventTimestamp": 1774287820074,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 1588,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287820092,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8471,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"error\",\"msg\":\"Sandbox error\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"timestamp\":\"2026-03-23T17:43:50.129Z\",\"error\":{\"message\":\"Shutdown container connection\",\"stack\":\"Error: Shutdown container connection\",\"name\":\"Error\"}}"
            ],
            "level": "error",
            "timestamp": 1774287830129
        }
    ],
    "eventTimestamp": 1774287820353,
    "event": {
        "scheduledTime": "2026-03-23T17:43:10.765Z"
    }
}
{
    "wallTime": 73,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "exception",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "Port 3000 is ready"
            ],
            "level": "log",
            "timestamp": 1774287830198
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Version retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"unknown\",\"timestamp\":\"2026-03-23T17:43:50.228Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287830228
        },
        {
            "message": [
                "{\"level\":\"warn\",\"msg\":\"Container version check: Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.8\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"timestamp\":\"2026-03-23T17:43:50.228Z\"}"
            ],
            "level": "warn",
            "timestamp": 1774287830228
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Processes listed\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"1 processes\",\"timestamp\":\"2026-03-23T17:43:50.228Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287830228
        }
    ],
    "eventTimestamp": 1774287830166,
    "event": {
        "scheduledTime": "2026-03-23T17:43:41.694Z"
    }
}
{
    "wallTime": 18,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:43:50.246Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287830246
        }
    ],
    "eventTimestamp": 1774287830228,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 880,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287830246,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 6368,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287830298,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 23,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:44:00.336Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287840336
        }
    ],
    "eventTimestamp": 1774287840314,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10018,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287840336,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 17,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:44:10.387Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287850387
        }
    ],
    "eventTimestamp": 1774287850373,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 1130,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287850410,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10015,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287850387,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 20,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:44:20.438Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287860438
        }
    ],
    "eventTimestamp": 1774287860424,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10016,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287860438,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 18,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:44:30.496Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287870496
        }
    ],
    "eventTimestamp": 1774287870478,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10019,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287870496,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 18,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:44:40.552Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287880552
        }
    ],
    "eventTimestamp": 1774287880537,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10019,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287880552,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 6667,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287880578,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 17,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:44:50.612Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287890612
        }
    ],
    "eventTimestamp": 1774287890594,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10014,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287890612,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 19,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:45:00.665Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287900665
        }
    ],
    "eventTimestamp": 1774287900647,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 1658,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287900698,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10025,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287900665,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 22,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:45:10.729Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287910729
        }
    ],
    "eventTimestamp": 1774287910710,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10015,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287910729,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 23,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:45:20.783Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287920783
        }
    ],
    "eventTimestamp": 1774287920765,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10017,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287920783,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 16,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T17:45:30.839Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287930839
        }
    ],
    "eventTimestamp": 1774287930822,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 866,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/images/1774287869214_1_modern_hotel_room_interior_professional_workspace_.jpeg"
            ],
            "level": "log",
            "timestamp": 1774287932232
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLppu3EcwtUnIcOiLLtsbO7aFp, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774287932303
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/images/1774287869214_1_modern_hotel_room_interior_professional_workspace_.jpeg status=200"
            ],
            "level": "log",
            "timestamp": 1774287933097
        }
    ],
    "eventTimestamp": 1774287932230,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/images/1774287869214_1_modern_hotel_room_interior_professional_workspace_.jpeg",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f401798202ce6",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "priority": "u=1, i",
                "referer": "https://app.creativemachines.xyz/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 44,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Bhimavaram",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "postalCode": "521178",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "qav6KoI7zaOco7ywkKWIe7hWYFSE2dC2mPiUwqaHYR4=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "F5tj0i0DhqlhurVvvYRcl9uczSY=",
                "tlsClientExtensionsSha1Le": "Ub0hiYz6xIXyCiOV1CAuiP0tBpM=",
                "tlsClientHelloLength": "1754",
                "tlsClientAuth": {
                    "certPresented": "0",
                    "certVerified": "NONE",
                    "certRevoked": "0",
                    "certIssuerDN": "",
                    "certSubjectDN": "",
                    "certIssuerDNRFC2253": "",
                    "certSubjectDNRFC2253": "",
                    "certIssuerDNLegacy": "",
                    "certSubjectDNLegacy": "",
                    "certSerial": "",
                    "certIssuerSerial": "",
                    "certSKI": "",
                    "certIssuerSKI": "",
                    "certFingerprintSHA1": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certNotAfter": ""
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 33108
                },
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        },
        "response": {
            "status": 200
        }
    }
}
{
    "wallTime": 25036,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287933104,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24966,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287950619,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24994,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287980793,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180023,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287830517,
    "event": {
        "scheduledTime": "2026-03-23T17:43:51.141Z"
    }
}
{
    "wallTime": 80341,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"details\":\"/app/turn-result.json (19908 chars)\",\"timestamp\":\"2026-03-23T17:45:30.856Z\"}"
            ],
            "level": "log",
            "timestamp": 1774287930856
        }
    ],
    "eventTimestamp": 1774287930839,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 24998,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774287990846,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25026,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288009419,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24967,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288034199,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288059257,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25019,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288084217,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24977,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288109190,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25006,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288134194,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180048,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288011165,
    "event": {
        "scheduledTime": "2026-03-23T17:46:51.141Z"
    }
}
{
    "wallTime": 25008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288159163,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24988,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288184198,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25032,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288209202,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25040,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288234182,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24921,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288259199,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25014,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288284280,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24996,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288309249,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180050,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288191218,
    "event": {
        "scheduledTime": "2026-03-23T17:46:51.194Z"
    }
}
{
    "wallTime": 24987,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288334204,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24998,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288359204,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288384156,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24994,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288409162,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25113,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288434161,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24879,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288459182,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25011,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288484263,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180050,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288371269,
    "event": {
        "scheduledTime": "2026-03-23T17:49:51.244Z"
    }
}
{
    "wallTime": 24988,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288509148,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25589,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288534168,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24406,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288559151,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24995,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288584734,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288609241,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24998,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288634159,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25004,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288659151,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180049,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288551320,
    "event": {
        "scheduledTime": "2026-03-23T17:52:51.295Z"
    }
}
{
    "wallTime": 25014,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288684156,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24990,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288709167,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25044,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288734184,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25026,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288759153,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24924,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288784193,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24999,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288809332,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24988,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288834167,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25012,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288859181,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180051,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288731372,
    "event": {
        "scheduledTime": "2026-03-23T17:55:51.346Z"
    }
}
{
    "wallTime": 24993,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288884150,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24995,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288909276,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25014,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288934148,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24980,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288959143,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24997,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288984191,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25023,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289009123,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25005,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289034219,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180049,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774288911423,
    "event": {
        "scheduledTime": "2026-03-23T17:58:51.397Z"
    }
}
{
    "wallTime": 24985,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289059191,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24989,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289084175,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25018,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289109178,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25039,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289134159,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24977,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289159151,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25004,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289184208,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24950,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289209154,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180049,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289091474,
    "event": {
        "scheduledTime": "2026-03-23T18:01:51.449Z"
    }
}
{
    "wallTime": 25003,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289234167,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24993,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289259121,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25003,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289284127,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 1959,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289309104,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 1817,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "WS closed: session=a1319160-9d36-40cf-aa10-a1c0b3dc9748, code=1001, reason="
            ],
            "level": "log",
            "timestamp": 1774289335822
        }
    ],
    "eventTimestamp": 1774289334203,
    "event": {
        "getWebSocketEvent": {
            "wasClean": true,
            "code": 1001,
            "webSocketEventType": "close"
        }
    }
}
{
    "wallTime": 550,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns"
            ],
            "level": "log",
            "timestamp": 1774289337392
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLppu3EcwtUnIcOiLLtsbO7aFp, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774289337452
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns status=200"
            ],
            "level": "log",
            "timestamp": 1774289337936
        }
    ],
    "eventTimestamp": 1774289337268,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/api/campaigns",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f62652c082cea",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "priority": "u=1, i",
                "referer": "https://app.creativemachines.xyz/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 120,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Bhimavaram",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "postalCode": "521178",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "6H88pC+5lNPJW2OiZ0DRNqJz7T/Ys8LRebIUdgZvqvQ=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "kSLxNzNCOJuDrPl54Yjb9Nlyi8Q=",
                "tlsClientExtensionsSha1Le": "/TPk2KWEcQyrv2u411+6kmOQdgY=",
                "tlsClientHelloLength": "1741",
                "tlsClientAuth": {
                    "certPresented": "0",
                    "certVerified": "NONE",
                    "certRevoked": "0",
                    "certIssuerDN": "",
                    "certSubjectDN": "",
                    "certIssuerDNRFC2253": "",
                    "certSubjectDNRFC2253": "",
                    "certIssuerDNLegacy": "",
                    "certSubjectDNLegacy": "",
                    "certSerial": "",
                    "certIssuerSerial": "",
                    "certSKI": "",
                    "certIssuerSKI": "",
                    "certFingerprintSHA1": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certNotAfter": ""
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 16028
                },
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        },
        "response": {
            "status": 200
        }
    }
}
{
    "wallTime": 570,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/assets/folders"
            ],
            "level": "log",
            "timestamp": 1774289337364
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLppu3EcwtUnIcOiLLtsbO7aFp, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774289337457
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/assets/folders status=200"
            ],
            "level": "log",
            "timestamp": 1774289337931
        }
    ],
    "eventTimestamp": 1774289337267,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/api/assets/folders",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f62652c092cea",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "priority": "u=1, i",
                "referer": "https://app.creativemachines.xyz/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 120,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Bhimavaram",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "postalCode": "521178",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "6H88pC+5lNPJW2OiZ0DRNqJz7T/Ys8LRebIUdgZvqvQ=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "kSLxNzNCOJuDrPl54Yjb9Nlyi8Q=",
                "tlsClientExtensionsSha1Le": "/TPk2KWEcQyrv2u411+6kmOQdgY=",
                "tlsClientHelloLength": "1741",
                "tlsClientAuth": {
                    "certPresented": "0",
                    "certVerified": "NONE",
                    "certRevoked": "0",
                    "certIssuerDN": "",
                    "certSubjectDN": "",
                    "certIssuerDNRFC2253": "",
                    "certSubjectDNRFC2253": "",
                    "certIssuerDNLegacy": "",
                    "certSubjectDNLegacy": "",
                    "certSerial": "",
                    "certIssuerSerial": "",
                    "certSKI": "",
                    "certIssuerSKI": "",
                    "certFingerprintSHA1": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certNotAfter": ""
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 16028
                },
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        },
        "response": {
            "status": 200
        }
    }
}
{
    "wallTime": 613,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn3h3lj4i77lvx"
            ],
            "level": "log",
            "timestamp": 1774289338387
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLppu3EcwtUnIcOiLLtsbO7aFp, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774289338456
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn3h3lj4i77lvx status=200"
            ],
            "level": "log",
            "timestamp": 1774289338988
        }
    ],
    "eventTimestamp": 1774289338278,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/api/campaigns/campaign_mn3h3lj4i77lvx",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f626b7c942cea",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "priority": "u=1, i",
                "referer": "https://app.creativemachines.xyz/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 113,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Bhimavaram",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "postalCode": "521178",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "6H88pC+5lNPJW2OiZ0DRNqJz7T/Ys8LRebIUdgZvqvQ=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "kSLxNzNCOJuDrPl54Yjb9Nlyi8Q=",
                "tlsClientExtensionsSha1Le": "/TPk2KWEcQyrv2u411+6kmOQdgY=",
                "tlsClientHelloLength": "1741",
                "tlsClientAuth": {
                    "certPresented": "0",
                    "certVerified": "NONE",
                    "certRevoked": "0",
                    "certIssuerDN": "",
                    "certSubjectDN": "",
                    "certIssuerDNRFC2253": "",
                    "certSubjectDNRFC2253": "",
                    "certIssuerDNLegacy": "",
                    "certSubjectDNLegacy": "",
                    "certSerial": "",
                    "certIssuerSerial": "",
                    "certSKI": "",
                    "certIssuerSKI": "",
                    "certFingerprintSHA1": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certNotAfter": ""
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 26645
                },
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        },
        "response": {
            "status": 200
        }
    }
}
{
    "wallTime": 1537,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289337895,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 93563,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"error\",\"msg\":\"Sandbox error\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_586652af660f4d83\",\"timestamp\":\"2026-03-23T18:09:25.089Z\",\"error\":{\"message\":\"Network connection lost.\",\"stack\":\"Error: Network connection lost.\",\"name\":\"Error\"}}"
            ],
            "level": "error",
            "timestamp": 1774289365089
        }
    ],
    "eventTimestamp": 1774289271523,
    "event": {
        "scheduledTime": "2026-03-23T18:04:51.499Z"
    }
}
{
    "wallTime": 14,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289365810,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 14,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289365798,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 755,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "exception",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289365117,
    "event": {
        "scheduledTime": "2026-03-23T18:07:51.550Z"
    }
}
{
    "wallTime": 303,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"/app/agent-status.json (53 chars)\",\"timestamp\":\"2026-03-23T18:09:25.911Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289365911
        }
    ],
    "eventTimestamp": 1774289365876,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 477,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"/app/next-prompt.json (381 chars)\",\"timestamp\":\"2026-03-23T18:09:26.247Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289366247
        }
    ],
    "eventTimestamp": 1774289366226,
    "event": {
        "rpcMethod": "writeFile"
    }
}
{
    "wallTime": 22,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:09:35.820Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289375820
        }
    ],
    "eventTimestamp": 1774289375797,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10016,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"error\",\"msg\":\"Sandbox error\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"timestamp\":\"2026-03-23T18:09:45.839Z\",\"error\":{\"message\":\"Shutdown container connection\",\"stack\":\"Error: Shutdown container connection\",\"name\":\"Error\"}}"
            ],
            "level": "error",
            "timestamp": 1774289385839
        }
    ],
    "eventTimestamp": 1774289375820,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 19152,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289366447,
    "event": {
        "scheduledTime": "2026-03-23T18:09:26.718Z"
    }
}
{
    "wallTime": 23,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:09:45.967Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289385967
        }
    ],
    "eventTimestamp": 1774289385950,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 861,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289385967,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8098,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289386027,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 18,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:09:56.063Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289396063
        }
    ],
    "eventTimestamp": 1774289396044,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10015,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289396063,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 25,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:10:06.121Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289406121
        }
    ],
    "eventTimestamp": 1774289406099,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 2697,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289406153,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10022,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289406121,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 19,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:10:16.182Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289416182
        }
    ],
    "eventTimestamp": 1774289416166,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10015,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289416182,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 19,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:10:26.234Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289426234
        }
    ],
    "eventTimestamp": 1774289426218,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10023,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289426234,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 19,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:10:36.301Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289436301
        }
    ],
    "eventTimestamp": 1774289436284,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 8400,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289436328,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10018,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289436301,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 20,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:10:46.358Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289446358
        }
    ],
    "eventTimestamp": 1774289446342,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 790,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/images/1774289377751_1_anderson_clay_diorama_miniature_theater_scene_top_.jpeg"
            ],
            "level": "log",
            "timestamp": 1774289447983
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLppu3EcwtUnIcOiLLtsbO7aFp, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774289448070
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/images/1774289377751_1_anderson_clay_diorama_miniature_theater_scene_top_.jpeg status=200"
            ],
            "level": "log",
            "timestamp": 1774289448769
        }
    ],
    "eventTimestamp": 1774289447778,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/images/1774289377751_1_anderson_clay_diorama_miniature_theater_scene_top_.jpeg",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0f6517db7c2ce8",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "priority": "u=1, i",
                "referer": "https://app.creativemachines.xyz/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 23,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Bhimavaram",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "81.52322",
                "latitude": "16.54078",
                "postalCode": "521178",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "NZpp4je6TLCDADr1rD92SZwrNNq4DkbUhlUMbM5mrLU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "1arhkjPBOBsifDy6YbxoZJdZmtw=",
                "tlsClientExtensionsSha1Le": "qQF+V3ks1WwIpr5JF/e7KIj72lc=",
                "tlsClientHelloLength": "1751",
                "tlsClientAuth": {
                    "certPresented": "0",
                    "certVerified": "NONE",
                    "certRevoked": "0",
                    "certIssuerDN": "",
                    "certSubjectDN": "",
                    "certIssuerDNRFC2253": "",
                    "certSubjectDNRFC2253": "",
                    "certIssuerDNLegacy": "",
                    "certSubjectDNLegacy": "",
                    "certSerial": "",
                    "certIssuerSerial": "",
                    "certSKI": "",
                    "certIssuerSKI": "",
                    "certFingerprintSHA1": "",
                    "certFingerprintSHA256": "",
                    "certNotBefore": "",
                    "certNotAfter": ""
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 61770
                },
                "botManagement": {
                    "corporateProxy": false,
                    "verifiedBot": false,
                    "jsDetection": {
                        "passed": false
                    },
                    "staticResource": false,
                    "detectionIds": {},
                    "score": 99
                }
            }
        },
        "response": {
            "status": 200
        }
    }
}
{
    "wallTime": 10973,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289456070,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 31014,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"/app/turn-result.json (17457 chars)\",\"timestamp\":\"2026-03-23T18:10:46.378Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289446378
        }
    ],
    "eventTimestamp": 1774289446358,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 20,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289477388,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 20,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289446635,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 269,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"/app/agent-status.json (53 chars)\",\"timestamp\":\"2026-03-23T18:11:17.416Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289477416
        }
    ],
    "eventTimestamp": 1774289477408,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 9659,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"/app/next-prompt.json (364 chars)\",\"timestamp\":\"2026-03-23T18:11:17.718Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289477718
        }
    ],
    "eventTimestamp": 1774289477699,
    "event": {
        "rpcMethod": "writeFile"
    }
}
{
    "wallTime": 21,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:11:27.401Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289487401
        }
    ],
    "eventTimestamp": 1774289487383,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10021,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289487401,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 9500,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289487429,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 18,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:11:37.459Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289497459
        }
    ],
    "eventTimestamp": 1774289497445,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10013,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289497459,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 21,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:11:47.513Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289507513
        }
    ],
    "eventTimestamp": 1774289507495,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 4587,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289507539,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10022,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289507513,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 23,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:11:57.575Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289517575
        }
    ],
    "eventTimestamp": 1774289517558,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10018,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289517575,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 21,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:12:07.637Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289527637
        }
    ],
    "eventTimestamp": 1774289527620,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10018,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289527637,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 21,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:12:17.707Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289537707
        }
    ],
    "eventTimestamp": 1774289537689,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10018,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289537707,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 9796,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "81d2b5490e2776965226ef8d52a126f669f2f804532862f2b8c3d93eac4b5f7b",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289537737,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 17,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"ID: proc_1774287728681_3wnn4e, stdout: 26029 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T18:12:27.763Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289547763
        }
    ],
    "eventTimestamp": 1774289547748,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 180020,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774289386244,
    "event": {
        "scheduledTime": "2026-03-23T18:09:46.850Z"
    }
}
{
    "wallTime": 19123,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "f94585b8-54ef-4723-b8be-6515f45cf588"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"dadfc5ffc30347ae09b6fc0dbfe1f31f2fe0924da3fefe39b53f7712c37a72bc\",\"traceId\":\"tr_426a073d30b44a02\",\"details\":\"/app/turn-result.json (17244 chars)\",\"timestamp\":\"2026-03-23T18:12:27.783Z\"}"
            ],
            "level": "log",
            "timestamp": 1774289547783
        }
    ],
    "eventTimestamp": 1774289547763,
    "event": {
        "rpcMethod": "readFile"
    }
}