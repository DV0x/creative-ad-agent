Last login: Tue Mar 24 18:29:12 on ttys004
chakra@chakras-MacBook-Air creative_agent % cd cloudflare && npx wrangler tail --env staging --format json
{
    "wallTime": 27,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "responseStreamDisconnected",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357322956,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/ws?token=REDACTED.REDACTED.REDACTED",
            "method": "GET",
            "headers": {
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "cf-connecting-ip": "175.101.96.209",
                "cf-ipcountry": "IN",
                "cf-ray": "9e15de30be132ce8",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "connection": "Upgrade",
                "cookie": "REDACTED",
                "host": "creative-agent-staging.alphasapien17.workers.dev",
                "origin": "https://creative-agent-staging.alphasapien17.workers.dev",
                "pragma": "no-cache",
                "sec-websocket-key": "REDACTED",
                "sec-websocket-version": "13",
                "upgrade": "websocket",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.209",
                "x-user-id": "user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk"
            },
            "cf": {
                "clientTcpRtt": 23,
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
                "tlsClientCiphersSha1": "nMpRlZ4lTrA1qr3kRPIX9Rui0AY=",
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
                "tlsClientRandom": "eJV0dcC2C8auec2ZM8Hn1kWdPOn2Mt6/9Z+qK5SVNSw=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "9755c4186af6735d0e9b68ab66ab973cac31b5ebec6f338af9788407ca2aca43",
                    "clientHandshake": "5759952da044a9434714569c444f477d54813275cc654d5b28e91aeecde79fc4",
                    "serverHandshake": "c038cc8a5f9462391c04d9eaf6f613520be9feaea7ef5f02d2b8bf198588a6f0",
                    "serverFinished": "e390064311c77c67db86b1abe785a886aa038b981372a9deecf11d3ff7e635a9"
                },
                "tlsClientHelloLength": "1746",
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
                "tlsClientExtensionsSha1Le": "4e0kMtIkqZl1y07dmgAKQZo3478=",
                "tlsClientExtensionsSha1": "7uHgJ3NYKK63kJ2K17NI8tLzKlk=",
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
    "wallTime": 1246,
    "cpuTime": 9,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357373637,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 3,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "WS closed: session=52ed9f7e-21d2-47f0-b758-53998fdc2831, code=1006, reason=WebSocket disconnected without sending Close frame."
            ],
            "level": "log",
            "timestamp": 1774357391096
        }
    ],
    "eventTimestamp": 1774357391070,
    "event": {
        "getWebSocketEvent": {
            "wasClean": false,
            "code": 1006,
            "webSocketEventType": "close"
        }
    }
}
{
    "wallTime": 509,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "responseStreamDisconnected",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][ws_upgrade] method=GET"
            ],
            "level": "log",
            "timestamp": 1774357322597
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774357322911
        },
        {
            "message": [
                "[trace][worker][ws_auth] userId=user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk tokenPresent=true"
            ],
            "level": "log",
            "timestamp": 1774357322911
        },
        {
            "message": [
                "[trace][worker][ws_forward] userId=user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk"
            ],
            "level": "log",
            "timestamp": 1774357322911
        }
    ],
    "eventTimestamp": 1774357322509,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/ws?token=REDACTED.REDACTED.REDACTED",
            "method": "GET",
            "headers": {
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "cf-connecting-ip": "175.101.96.209",
                "cf-ipcountry": "IN",
                "cf-ray": "9e15de30be132ce8",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "connection": "Upgrade",
                "cookie": "REDACTED",
                "host": "creative-agent-staging.alphasapien17.workers.dev",
                "origin": "https://creative-agent-staging.alphasapien17.workers.dev",
                "pragma": "no-cache",
                "sec-websocket-key": "REDACTED",
                "sec-websocket-version": "13",
                "upgrade": "websocket",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.209"
            },
            "cf": {
                "clientTcpRtt": 23,
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
                "tlsClientCiphersSha1": "nMpRlZ4lTrA1qr3kRPIX9Rui0AY=",
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
                "tlsClientRandom": "eJV0dcC2C8auec2ZM8Hn1kWdPOn2Mt6/9Z+qK5SVNSw=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "9755c4186af6735d0e9b68ab66ab973cac31b5ebec6f338af9788407ca2aca43",
                    "clientHandshake": "5759952da044a9434714569c444f477d54813275cc654d5b28e91aeecde79fc4",
                    "serverHandshake": "c038cc8a5f9462391c04d9eaf6f613520be9feaea7ef5f02d2b8bf198588a6f0",
                    "serverFinished": "e390064311c77c67db86b1abe785a886aa038b981372a9deecf11d3ff7e635a9"
                },
                "tlsClientHelloLength": "1746",
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
                "tlsClientExtensionsSha1Le": "4e0kMtIkqZl1y07dmgAKQZo3478=",
                "tlsClientExtensionsSha1": "7uHgJ3NYKK63kJ2K17NI8tLzKlk=",
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
    "wallTime": 236,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357393986,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 392,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357405021,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 1392,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "Error checking 3000: The container is not listening in the TCP address 10.0.0.1:3000"
            ],
            "level": "debug",
            "timestamp": 1774357405765
        },
        {
            "message": [
                "Error checking 3000: The container is not listening in the TCP address 10.0.0.1:3000"
            ],
            "level": "debug",
            "timestamp": 1774357406091
        }
    ],
    "eventTimestamp": 1774357405136,
    "event": {
        "rpcMethod": "listProcesses"
    }
}
{
    "wallTime": 311,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "exception",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "Port 3000 is ready"
            ],
            "level": "log",
            "timestamp": 1774357406426
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Version retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"unknown\",\"timestamp\":\"2026-03-24T13:03:26.466Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357406466
        },
        {
            "message": [
                "{\"level\":\"warn\",\"msg\":\"Container version check: Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.19\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"timestamp\":\"2026-03-24T13:03:26.466Z\"}"
            ],
            "level": "warn",
            "timestamp": 1774357406466
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Session created\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: sandbox-user-user_3aqqroz7m9jq7rmhyg5al9xxtxk-v2\",\"timestamp\":\"2026-03-24T13:03:26.472Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357406472
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Processes listed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"0 processes\",\"timestamp\":\"2026-03-24T13:03:26.514Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357406514
        }
    ],
    "eventTimestamp": 1774357406091,
    "event": {
        "scheduledTime": "2026-03-24T13:03:26.310Z"
    }
}
{
    "wallTime": 94,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357406523,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 14784,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T1][do][fetch] userId=user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk path=/ws upgrade=websocket"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T2][session][restore.agentProcessId] processId=proc_1774348116399_6acwc4"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T3][session][restore.found] session=52ed9f7e-21d2-47f0-b758-53998fdc2831 campaign=campaign_mn4mksgqv37yl2 gen=true userId=user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T4][do][ws.accepted] cid=campaign_mn4mksgqv37yl2 wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T5][ws][message] cid=campaign_mn4mksgqv37yl2 type=subscribe gen=true session=52ed9f7e-21d2-47f0-b758-53998fdc2831"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T6][handler][subscribe.enter] cid=campaign_mn4mksgqv37yl2 sessionId=52ed9f7e-21d2-47f0-b758-53998fdc2831 lastEventId=2 hasEvents=false gen=true"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T7][handler][subscribe.doReset] cid=campaign_mn4mksgqv37yl2 reason=empty_event_buffer"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T8][handler][subscribe.d1Check] cid=campaign_mn4mksgqv37yl2 d1Status=generating campaignId=campaign_mn4mksgqv37yl2"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T9][handler][subscribe.restartAlarm] cid=campaign_mn4mksgqv37yl2 reason=DO_reset_while_generating"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T10][handler][subscribe.restoredFromStorage] cid=campaign_mn4mksgqv37yl2"
            ],
            "level": "log",
            "timestamp": 1774357404952
        },
        {
            "message": [
                "[T11][handler][subscribe.replay] cid=campaign_mn4mksgqv37yl2 eventCount=0 lastEventId=2"
            ],
            "level": "log",
            "timestamp": 1774357404952
        }
    ],
    "eventTimestamp": 1774357395211,
    "event": {
        "scheduledTime": "2026-03-24T13:03:24.951Z"
    }
}
{
    "wallTime": 25153,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357406807,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 21633,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357419992,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 0,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357466769,
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
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357470061,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 15,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357495183,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 14,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357520094,
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
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357545085,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180020,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357406616,
    "event": {
        "scheduledTime": "2026-03-24T13:03:26.512Z"
    }
}
{
    "wallTime": 344,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/health"
            ],
            "level": "log",
            "timestamp": 1774357591251
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/health status=200"
            ],
            "level": "log",
            "timestamp": 1774357591592
        }
    ],
    "eventTimestamp": 1774357591249,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/health",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "cf-connecting-ip": "175.101.96.209",
                "cf-ipcountry": "IN",
                "cf-ray": "9e15e4c04da12ceb",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "host": "creative-agent-staging.alphasapien17.workers.dev",
                "user-agent": "curl/8.7.1",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.209"
            },
            "cf": {
                "httpProtocol": "HTTP/2",
                "requestPriority": "weight=16;exclusive=0;group=0;group-weight=0",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 19,
                "clientQuicRtt": 0,
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
                "tlsCipher": "AEAD-CHACHA20-POLY1305-SHA256",
                "tlsClientRandom": "qphcoI18Q+mPmWvO1c3hqKS8SHu0zuH5ti954Ra2ghQ=",
                "tlsClientCiphersSha1": "eDGmD1H99AwNYzOR+7eoGLo6eLU=",
                "tlsClientExtensionsSha1": "Ub+nUmIm1U57hdNSUph0R+kx9Gc=",
                "tlsClientExtensionsSha1Le": "NMNf2YIpLBhtroOEBooGFi+jtJ8=",
                "tlsExportedAuthenticator": {
                    "clientHandshake": "0c7524cfe3480867748fc23280571ca1a832425034c5dbe4055eb7b33e8617aa",
                    "serverHandshake": "71716d299330bbf575ac5d5561e56f00d7f36ea7a540c65a17167dbc2447b290",
                    "clientFinished": "2ba9bcb70d600c93b6f7487961df67c95cab0377bbbb4179a66cb7df2f16cf60",
                    "serverFinished": "d0d2e95e00b8970ab633eed02b633c445793aaa54816cd0ad643d0b57102cfeb"
                },
                "tlsClientHelloLength": "349",
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
                    "deliveryRate": 103273
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
    "wallTime": 14,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357570122,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 14,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357595068,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 14,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357620088,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 15,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357645075,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 13,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357670060,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 15,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357695159,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 13,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357728105,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180028,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357586632,
    "event": {
        "scheduledTime": "2026-03-24T13:03:26.617Z"
    }
}
{
    "wallTime": 536,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357753354,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 2,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357766906,
    "event": {
        "rpcMethod": "cleanupCompletedProcesses"
    }
}
{
    "wallTime": 95,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"pkill -f agent-runner 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-24T13:09:30.888Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357770888
        }
    ],
    "eventTimestamp": 1774357770817,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Unmounting bucket from /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"timestamp\":\"2026-03-24T13:09:30.914Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357770914
        }
    ],
    "eventTimestamp": 1774357770888,
    "event": {
        "rpcMethod": "unmountBucket"
    }
}
{
    "wallTime": 86,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2, Success: true\",\"timestamp\":\"2026-03-24T13:09:31.002Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771002
        }
    ],
    "eventTimestamp": 1774357770914,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 345,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Mounting bucket creative-agent-assets to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"timestamp\":\"2026-03-24T13:09:31.007Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771007
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"/tmp/.passwd-s3fs-9c1ce05b-335e-4863-bc0f-0e605aef8268 (119 chars)\",\"timestamp\":\"2026-03-24T13:09:31.035Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771035
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"chmod 0600 '/tmp/.passwd-s3fs-9c1ce05b-335e-4863-bc0f-0e605aef8268', Success: true\",\"timestamp\":\"2026-03-24T13:09:31.114Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771114
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"mkdir -p '/mnt/r2', Success: true\",\"timestamp\":\"2026-03-24T13:09:31.190Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771190
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"s3fs 'creative-agent-assets:/users/user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk' '/mnt/r2' -o 'passwd_file=/tmp/.passwd-s3fs-9c1ce05b-335e-4863-bc0f-0e605aef8268,nomixupload,url=https://091650847ca6a1d9bb40bee044dfdc91.r2.cloudflarestorage.com', Success: true\",\"timestamp\":\"2026-03-24T13:09:31.347Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771347
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Successfully mounted bucket creative-agent-assets to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"timestamp\":\"2026-03-24T13:09:31.347Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357771347
        }
    ],
    "eventTimestamp": 1774357771002,
    "event": {
        "rpcMethod": "mountBucket"
    }
}
{
    "wallTime": 1547,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"node -e \\\"\\n          async function test() {\\n            const r1 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});\\n            console.log('WITH_KEY='+r1.status);\\n            const r3 = await fetch('https://httpbin.org/ip');\\n            const t3 = await r3.text();\\n            console.log('IP='+t3.trim());\\n          }\\n          test().catch(e=>console.log('ERR='+e.message));\\n        \\\", Success: true\",\"timestamp\":\"2026-03-24T13:09:32.897Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357772897
        }
    ],
    "eventTimestamp": 1774357771347,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 40,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"rm -f /app/generated-images.jsonl /app/turn-result.json 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-24T13:09:32.938Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357772938
        }
    ],
    "eventTimestamp": 1774357772897,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 45,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"rm -rf /app/agent/files/* 2>/dev/null; rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-24T13:09:32.982Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357772982
        }
    ],
    "eventTimestamp": 1774357772938,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 36,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 8006 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:09:40.612Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357780612
        }
    ],
    "eventTimestamp": 1774357780578,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10033,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357780612,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 34,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 14201 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:09:50.716Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357790716
        }
    ],
    "eventTimestamp": 1774357790684,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 6037,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357792376,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10036,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357790716,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 34,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 16051 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:10:00.822Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357800822
        }
    ],
    "eventTimestamp": 1774357800788,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10036,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357800822,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 34,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 28894 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:10:10.922Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357810922
        }
    ],
    "eventTimestamp": 1774357810894,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10032,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357810922,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 1229,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357819323,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 45,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 58315 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:10:21.038Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357821038
        }
    ],
    "eventTimestamp": 1774357820994,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10035,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357821038,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 40,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 74582 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:10:31.149Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357831149
        }
    ],
    "eventTimestamp": 1774357831115,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10037,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357831149,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 40,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 85117 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:10:41.261Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357841261
        }
    ],
    "eventTimestamp": 1774357841223,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10033,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357841261,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 6568,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=44634a0f"
            ],
            "level": "log",
            "timestamp": 1774357847461
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774357847461
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774357847699
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=e974dfb1"
            ],
            "level": "log",
            "timestamp": 1774357847699
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=b605d845"
            ],
            "level": "log",
            "timestamp": 1774357848868
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [thinking]"
            ],
            "level": "log",
            "timestamp": 1774357848868
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=7638fc9e"
            ],
            "level": "log",
            "timestamp": 1774357849169
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [text]"
            ],
            "level": "log",
            "timestamp": 1774357849169
        },
        {
            "message": [
                "[sdk-parser] EMIT message text (61 chars): Hooks complete. Now generating visual concepts and prompts..."
            ],
            "level": "log",
            "timestamp": 1774357849169
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=0b765575"
            ],
            "level": "log",
            "timestamp": 1774357849472
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774357849472
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774357849472
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=f5441b5e"
            ],
            "level": "log",
            "timestamp": 1774357849472
        },
        {
            "message": [
                "An RPC stub was not disposed properly. You must call dispose() on all stubs in order to let the other side know that you are no longer using them. You cannot rely on the garbage collector for this because it may take arbitrarily long before actually collecting unreachable objects. As a shortcut, calling dispose() on the result of an RPC call disposes all stubs within it."
            ],
            "level": "warn",
            "timestamp": 1774357849472
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=dfa580d5"
            ],
            "level": "log",
            "timestamp": 1774357849472
        }
    ],
    "eventTimestamp": 1774357841301,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 43,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 115410 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:10:51.369Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357851369
        }
    ],
    "eventTimestamp": 1774357851331,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10030,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357851369,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 46,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 122781 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:11:01.480Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357861480
        }
    ],
    "eventTimestamp": 1774357861440,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 1802,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357863375,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10034,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357861480,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 42,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 122986 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:11:11.586Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357871586
        }
    ],
    "eventTimestamp": 1774357871553,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10030,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357871586,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 51,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 137866 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:11:21.703Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357881703
        }
    ],
    "eventTimestamp": 1774357881657,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10036,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357881703,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 65,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 161649 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:11:31.830Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357891830
        }
    ],
    "eventTimestamp": 1774357891776,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 7150,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357893344,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10028,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357891830,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 47,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 161854 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:11:41.944Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357901944
        }
    ],
    "eventTimestamp": 1774357901904,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10030,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357901944,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 50,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 161854 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:11:52.067Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357912067
        }
    ],
    "eventTimestamp": 1774357912021,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10033,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357912067,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 2371,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357912107,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 46,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 161854 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:12:02.178Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357922178
        }
    ],
    "eventTimestamp": 1774357922139,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10029,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357922178,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 51,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 162059 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:12:12.292Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357932292
        }
    ],
    "eventTimestamp": 1774357932248,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10030,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357932292,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 42,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 162059 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:12:22.401Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357942401
        }
    ],
    "eventTimestamp": 1774357942364,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 180029,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357766659,
    "event": {
        "scheduledTime": "2026-03-24T13:06:26.646Z"
    }
}
{
    "wallTime": 4296,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357942401,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 7721,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357942439,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 45,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 162059 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:12:32.508Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357952508
        }
    ],
    "eventTimestamp": 1774357952470,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 1187,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/images/1774357890649_1_bold_typography_dominant_ad_for_resend_email_api_b.jpeg"
            ],
            "level": "log",
            "timestamp": 1774357959320
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3AQQRoZ7M9jq7Rmhyg5aL9xXTxk, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774357959818
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/images/1774357890649_1_bold_typography_dominant_ad_for_resend_email_api_b.jpeg status=200"
            ],
            "level": "log",
            "timestamp": 1774357960505
        }
    ],
    "eventTimestamp": 1774357959170,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/images/1774357890649_1_bold_typography_dominant_ad_for_resend_email_api_b.jpeg",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.209",
                "cf-ipcountry": "IN",
                "cf-ray": "9e15edbbfa2c2ceb",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "cookie": "REDACTED",
                "host": "creative-agent-staging.alphasapien17.workers.dev",
                "priority": "u=1, i",
                "referer": "https://creative-agent-staging.alphasapien17.workers.dev/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.209"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 68,
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
                "tlsClientRandom": "KNj4vyfooCHQe9kioQww+NSGnFZT7bKg1qh05KSjgKI=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "Z5xt6NNpJm9RvQNpkUHKQ+QaT3Q=",
                "tlsClientExtensionsSha1Le": "bSArvBFslxGWzkV5HroSNCBbn5A=",
                "tlsClientHelloLength": "1764",
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
                    "deliveryRate": 18843
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
    "wallTime": 10029,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357952508,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 43,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 172196 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:12:42.615Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357962615
        }
    ],
    "eventTimestamp": 1774357962578,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 2935,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357964217,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10035,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357962615,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 51,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"ID: proc_1774357773010_t5irq6, stdout: 176041 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T13:12:52.728Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357972728
        }
    ],
    "eventTimestamp": 1774357972685,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 24999,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358013293
        }
    ],
    "eventTimestamp": 1774357992303,
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
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358043356
        }
    ],
    "eventTimestamp": 1774358013293,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25043,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774358043356,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24958,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358073329
        }
    ],
    "eventTimestamp": 1774358044955,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25031,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358103306
        }
    ],
    "eventTimestamp": 1774358073329,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180029,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774357946706,
    "event": {
        "scheduledTime": "2026-03-24T13:09:26.676Z"
    }
}
{
    "wallTime": 153994,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8\",\"traceId\":\"tr_77ae950f89af4b2e\",\"details\":\"/app/turn-result.json (18046 chars)\",\"timestamp\":\"2026-03-24T13:12:52.771Z\"}"
            ],
            "level": "log",
            "timestamp": 1774357972771
        }
    ],
    "eventTimestamp": 1774357972728,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 24973,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358133389
        }
    ],
    "eventTimestamp": 1774358103306,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25087,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358163386
        }
    ],
    "eventTimestamp": 1774358133389,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24986,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358193376
        }
    ],
    "eventTimestamp": 1774358163386,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25002,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774358193376,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 48033,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358223354
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358253321
        }
    ],
    "eventTimestamp": 1774358195036,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180031,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "9356f31e8b73b6dfb4695fd574b0e789d54149dda0bbf5c832b6be240cb256f8",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774358126738,
    "event": {
        "scheduledTime": "2026-03-24T13:12:26.707Z"
    }
}
{
    "wallTime": 59995,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358283316
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358313302
        }
    ],
    "eventTimestamp": 1774358253321,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 59990,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358343374
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358373368
        }
    ],
    "eventTimestamp": 1774358313302,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 17286,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358403366
        }
    ],
    "eventTimestamp": 1774358373368,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 14601,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774358403366,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "4cdf2665b4c2d231410ffaaaeb467798c75337f32f16fa4a755def85e886e0dc",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "125bb093-dd2e-4742-8c65-b7cd0fcf55b8"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774358433350
        }
    ],
    "eventTimestamp": 1774358405373,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}