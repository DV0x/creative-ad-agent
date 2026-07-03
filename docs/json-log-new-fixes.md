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