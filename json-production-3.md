Last login: Tue Mar 24 10:50:46 on ttys000
chakra@chakras-MacBook-Air creative_agent % npx wrangler tail creative-agent-production --format json
{
    "wallTime": 565,
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
            "timestamp": 1774330582120
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BNXbrQsVgKhrw9VYtzYjnMz38h, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774330582172
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns status=200"
            ],
            "level": "log",
            "timestamp": 1774330582679
        }
    ],
    "eventTimestamp": 1774330582008,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/api/campaigns",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.209",
                "cf-ipcountry": "IN",
                "cf-ray": "9e135158bfae2ce5",
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
                "x-real-ip": "175.101.96.209"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 20,
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
                "tlsClientRandom": "DLIz7ZZgLYaugquaDncmz4rNY6rXsDwBWYz3HTvMKc0=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "+PKhNnqzR46zFhDdi0ZpXaz1bK8=",
                "tlsClientExtensionsSha1Le": "o1jU2cC9wN1QPVRxJ+zSkOK1j/A=",
                "tlsClientHelloLength": "1938",
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
                    "deliveryRate": 99322
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
    "wallTime": 557,
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
                "[trace][worker][api] method=GET path=/api/assets/folders"
            ],
            "level": "log",
            "timestamp": 1774330582125
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BNXbrQsVgKhrw9VYtzYjnMz38h, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774330582236
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/assets/folders status=200"
            ],
            "level": "log",
            "timestamp": 1774330582677
        }
    ],
    "eventTimestamp": 1774330582010,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/api/assets/folders",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.209",
                "cf-ipcountry": "IN",
                "cf-ray": "9e135158bfaf2ce5",
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
                "x-real-ip": "175.101.96.209"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 20,
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
                "tlsClientRandom": "DLIz7ZZgLYaugquaDncmz4rNY6rXsDwBWYz3HTvMKc0=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "+PKhNnqzR46zFhDdi0ZpXaz1bK8=",
                "tlsClientExtensionsSha1Le": "o1jU2cC9wN1QPVRxJ+zSkOK1j/A=",
                "tlsClientHelloLength": "1938",
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
                    "deliveryRate": 99322
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
    "wallTime": 6,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330582410,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 189,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330626905,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 189,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330627067,
    "event": {
        "rpcMethod": "cleanupCompletedProcesses"
    }
}
{
    "wallTime": 189,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330627067,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 1484,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "Error checking 3000: The container is not listening in the TCP address 10.0.0.1:3000"
            ],
            "level": "debug",
            "timestamp": 1774330627580
        }
    ],
    "eventTimestamp": 1774330627217,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 16,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Unmounting bucket from /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"timestamp\":\"2026-03-24T05:37:08.738Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628738
        }
    ],
    "eventTimestamp": 1774330628736,
    "event": {
        "rpcMethod": "unmountBucket"
    }
}
{
    "wallTime": 56,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2, Success: true\",\"timestamp\":\"2026-03-24T05:37:08.793Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628793
        }
    ],
    "eventTimestamp": 1774330628738,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 269,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Mounting bucket creative-agent-assets-prod to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"timestamp\":\"2026-03-24T05:37:08.810Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628810
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"/tmp/.passwd-s3fs-dea99bad-e289-4959-80cc-87164fcdb4a6 (124 chars)\",\"timestamp\":\"2026-03-24T05:37:08.819Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628819
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"chmod 0600 '/tmp/.passwd-s3fs-dea99bad-e289-4959-80cc-87164fcdb4a6', Success: true\",\"timestamp\":\"2026-03-24T05:37:08.833Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628833
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"mkdir -p '/mnt/r2', Success: true\",\"timestamp\":\"2026-03-24T05:37:08.888Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628888
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"s3fs 'creative-agent-assets-prod:/users/user_3BNXbrQsVgKhrw9VYtzYjnMz38h' '/mnt/r2' -o 'passwd_file=/tmp/.passwd-s3fs-dea99bad-e289-4959-80cc-87164fcdb4a6,nomixupload,url=https://091650847ca6a1d9bb40bee044dfdc91.r2.cloudflarestorage.com', Success: true\",\"timestamp\":\"2026-03-24T05:37:09.062Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330629062
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Successfully mounted bucket creative-agent-assets-prod to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"timestamp\":\"2026-03-24T05:37:09.062Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330629062
        }
    ],
    "eventTimestamp": 1774330628793,
    "event": {
        "rpcMethod": "mountBucket"
    }
}
{
    "wallTime": 1234,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"node -e \\\"\\n          async function test() {\\n            const r1 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});\\n            console.log('WITH_KEY='+r1.status);\\n            const r3 = await fetch('https://httpbin.org/ip');\\n            const t3 = await r3.text();\\n            console.log('IP='+t3.trim());\\n          }\\n          test().catch(e=>console.log('ERR='+e.message));\\n        \\\", Success: true\",\"timestamp\":\"2026-03-24T05:37:10.301Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330630301
        }
    ],
    "eventTimestamp": 1774330629062,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 31,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"rm -f /app/generated-images.jsonl /app/turn-result.json 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-24T05:37:10.332Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330630332
        }
    ],
    "eventTimestamp": 1774330630301,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 43,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"rm -rf /app/agent/files/* 2>/dev/null; rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-24T05:37:10.373Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330630373
        }
    ],
    "eventTimestamp": 1774330630332,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 3779,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[sdk-parser] msg.type=system uuid=00e85826"
            ],
            "level": "log",
            "timestamp": 1774330632822
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774330632822
        }
    ],
    "eventTimestamp": 1774330632575,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 21,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 1686 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:37:16.570Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330636570
        }
    ],
    "eventTimestamp": 1774330636549,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330636570,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 13348 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:37:26.633Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330646633
        }
    ],
    "eventTimestamp": 1774330646613,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330646633,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 23,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 15617 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:37:36.701Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330656701
        }
    ],
    "eventTimestamp": 1774330656680,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 9025,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[sdk-parser] msg.type=user uuid=e8b188de"
            ],
            "level": "log",
            "timestamp": 1774330658511
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774330660723
        }
    ],
    "eventTimestamp": 1774330656735,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10023,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330656701,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 23,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 19137 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:37:46.769Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330666769
        }
    ],
    "eventTimestamp": 1774330666749,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330666769,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 26395 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:37:56.836Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330676836
        }
    ],
    "eventTimestamp": 1774330676816,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 4030,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[sdk-parser] msg.type=assistant uuid=c30e3544"
            ],
            "level": "log",
            "timestamp": 1774330683755
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [thinking]"
            ],
            "level": "log",
            "timestamp": 1774330683755
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=4b927766"
            ],
            "level": "log",
            "timestamp": 1774330683957
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [text]"
            ],
            "level": "log",
            "timestamp": 1774330683957
        },
        {
            "message": [
                "[sdk-parser] EMIT message text (56 chars): Great! Now let me check if the hooks file was generated:"
            ],
            "level": "log",
            "timestamp": 1774330683957
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=6ef632b8"
            ],
            "level": "log",
            "timestamp": 1774330684260
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774330684260
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=e6c0b841"
            ],
            "level": "log",
            "timestamp": 1774330684260
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=625aae7a"
            ],
            "level": "log",
            "timestamp": 1774330685668
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [thinking]"
            ],
            "level": "log",
            "timestamp": 1774330685668
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=6a4c52a3"
            ],
            "level": "log",
            "timestamp": 1774330685970
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [text]"
            ],
            "level": "log",
            "timestamp": 1774330685970
        },
        {
            "message": [
                "[sdk-parser] EMIT message text (61 chars): Let me read the research file to generate the hooks manually:"
            ],
            "level": "log",
            "timestamp": 1774330685970
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=0a71adbe"
            ],
            "level": "log",
            "timestamp": 1774330686172
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774330686172
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=a0659b41"
            ],
            "level": "log",
            "timestamp": 1774330686172
        }
    ],
    "eventTimestamp": 1774330679332,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10023,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330676836,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 37,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 69381 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:38:06.907Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330686907
        }
    ],
    "eventTimestamp": 1774330686886,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330686907,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 29,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 69586 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:38:16.987Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330696987
        }
    ],
    "eventTimestamp": 1774330696965,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10020,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330696987,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 33,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 78584 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:38:27.060Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330707060
        }
    ],
    "eventTimestamp": 1774330707038,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 9407,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[sdk-parser] msg.type=assistant uuid=944e58a7"
            ],
            "level": "log",
            "timestamp": 1774330708596
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [thinking]"
            ],
            "level": "log",
            "timestamp": 1774330708596
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=da8156c8"
            ],
            "level": "log",
            "timestamp": 1774330708797
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [text]"
            ],
            "level": "log",
            "timestamp": 1774330708797
        },
        {
            "message": [
                "[sdk-parser] EMIT message text (49 chars): Hooks complete. Now generating visual concepts..."
            ],
            "level": "log",
            "timestamp": 1774330708797
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=56a61402"
            ],
            "level": "log",
            "timestamp": 1774330709100
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774330709100
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774330709100
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=33a57f20"
            ],
            "level": "log",
            "timestamp": 1774330709100
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=f32b8932"
            ],
            "level": "log",
            "timestamp": 1774330709100
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=d00ca45f"
            ],
            "level": "log",
            "timestamp": 1774330713927
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [thinking]"
            ],
            "level": "log",
            "timestamp": 1774330713927
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=925a2ba4"
            ],
            "level": "log",
            "timestamp": 1774330714127
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [text]"
            ],
            "level": "log",
            "timestamp": 1774330714127
        },
        {
            "message": [
                "[sdk-parser] EMIT message text (60 chars): Let me wait for the art-style skill to generate the prompts:"
            ],
            "level": "log",
            "timestamp": 1774330714127
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=c3b553ff"
            ],
            "level": "log",
            "timestamp": 1774330714229
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774330714229
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=c79cc1f4"
            ],
            "level": "log",
            "timestamp": 1774330714229
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=1f8745e1"
            ],
            "level": "log",
            "timestamp": 1774330716554
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [thinking]"
            ],
            "level": "log",
            "timestamp": 1774330716554
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=f82756ae"
            ],
            "level": "log",
            "timestamp": 1774330716957
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [text]"
            ],
            "level": "log",
            "timestamp": 1774330716957
        },
        {
            "message": [
                "[sdk-parser] EMIT message text (84 chars): I'll manually generate the prompts file based on the hooks and art-style guideli"
            ],
            "level": "log",
            "timestamp": 1774330716957
        }
    ],
    "eventTimestamp": 1774330707436,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10021,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330707060,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 32,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 118004 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:38:37.140Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330717140
        }
    ],
    "eventTimestamp": 1774330717118,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330717140,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 34,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 118209 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:38:47.212Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330727212
        }
    ],
    "eventTimestamp": 1774330727190,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 4555,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330727253,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10020,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330727212,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 35,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 118209 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:38:57.287Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330737287
        }
    ],
    "eventTimestamp": 1774330737266,
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
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330737287,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 35,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: proc_1774330630320_g840e8, stdout: 118209 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-24T05:39:07.366Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330747366
        }
    ],
    "eventTimestamp": 1774330747344,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10029,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"error\",\"msg\":\"Sandbox error\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"timestamp\":\"2026-03-24T05:39:17.425Z\",\"error\":{\"message\":\"Network connection lost.\",\"stack\":\"Error: Network connection lost.\",\"name\":\"Error\"}}"
            ],
            "level": "error",
            "timestamp": 1774330757425
        }
    ],
    "eventTimestamp": 1774330747366,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 129255,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
            "timestamp": 1774330628601
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Version retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"unknown\",\"timestamp\":\"2026-03-24T05:37:08.624Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628624
        },
        {
            "message": [
                "{\"level\":\"warn\",\"msg\":\"Container version check: Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.8\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"timestamp\":\"2026-03-24T05:37:08.624Z\"}"
            ],
            "level": "warn",
            "timestamp": 1774330628624
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Session created\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"ID: sandbox-user-user_3bnxbrqsvgkhrw9vytzyjnmz38h-v2\",\"timestamp\":\"2026-03-24T05:37:08.630Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628630
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_0ed29ad726bb4c1a\",\"details\":\"pkill -f agent-runner 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-24T05:37:08.720Z\"}"
            ],
            "level": "log",
            "timestamp": 1774330628720
        }
    ],
    "eventTimestamp": 1774330627580,
    "event": {
        "scheduledTime": "2026-03-24T05:37:08.253Z"
    }
}
{
    "wallTime": 292,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T224][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=12 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=122 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T225][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T226][rpc][listProcesses.done] cid=campaign_mn46n4t1y51nb7 ms=23"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T227][alarm][agentCheck] cid=campaign_mn46n4t1y51nb7 alive=true status=running processCount=1"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T228][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T229][rpc][getProcessLogs.done] cid=campaign_mn46n4t1y51nb7 ms=35"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T230][alarm][containerLogs.noNew] cid=campaign_mn46n4t1y51nb7 totalLen=118209"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T231][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T232][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=21 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T233][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T234][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=12 ms=79"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T235][emit][tool_start] cid=campaign_mn46n4t1y51nb7 eventId=40 wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T236][emit][file] cid=campaign_mn46n4t1y51nb7 eventId=41 wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330757410
        },
        {
            "message": [
                "[T237][emit][tool_end] cid=campaign_mn46n4t1y51nb7 eventId=42 wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330757410
        }
    ],
    "eventTimestamp": 1774330757003,
    "event": {
        "scheduledTime": "2026-03-24T05:39:17.410Z"
    }
}
{
    "wallTime": 9781,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330757484,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T238][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=13 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=132 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T239][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T240][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=74 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T241][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T242][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T243][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T244][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T245][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T246][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T247][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T248][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=13 ms=74"
            ],
            "level": "log",
            "timestamp": 1774330767485
        },
        {
            "message": [
                "[T249][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330767485
        }
    ],
    "eventTimestamp": 1774330767077,
    "event": {
        "scheduledTime": "2026-03-24T05:39:27.484Z"
    }
}
{
    "wallTime": 17679,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "exception",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330757560,
    "event": {
        "scheduledTime": "2026-03-24T05:39:17.425Z"
    }
}
{
    "wallTime": 5242,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T250][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=14 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=142 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T251][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T252][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T253][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T254][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T255][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T256][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T257][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T258][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T259][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330777486
        },
        {
            "message": [
                "[T260][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=14 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330777486
        }
    ],
    "eventTimestamp": 1774330777158,
    "event": {
        "scheduledTime": "2026-03-24T05:39:37.485Z"
    }
}
{
    "wallTime": 9015,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
                "{\"level\":\"error\",\"msg\":\"Sandbox error\",\"component\":\"sandbox-do\",\"sandboxId\":\"7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6\",\"traceId\":\"tr_98240b3ba50c4b35\",\"timestamp\":\"2026-03-24T05:39:44.243Z\",\"error\":{\"message\":\"Shutdown container connection\",\"stack\":\"Error: Shutdown container connection\",\"name\":\"Error\"}}"
            ],
            "level": "error",
            "timestamp": 1774330784243
        }
    ],
    "eventTimestamp": 1774330774253,
    "event": {
        "scheduledTime": "2026-03-24T05:39:35.240Z"
    }
}
{
    "wallTime": 26,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330784256,
    "event": {
        "scheduledTime": "2026-03-24T05:39:44.243Z"
    }
}
{
    "wallTime": 85,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "exception",
    "durableObjectId": "7ce8296220ee33e2a3f99880dc035e4068453a0fc77846b9d894d40170ecb1e6",
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
    "eventTimestamp": 1774330784301,
    "event": {
        "scheduledTime": "2026-03-24T05:39:44.275Z"
    }
}
{
    "wallTime": 4757,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330777727,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T261][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=15 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=152 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T262][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T263][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T264][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T265][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T266][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T267][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T268][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T269][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T270][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T271][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=15 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330787487
        },
        {
            "message": [
                "[T272][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330787487
        }
    ],
    "eventTimestamp": 1774330787232,
    "event": {
        "scheduledTime": "2026-03-24T05:39:47.486Z"
    }
}
{
    "wallTime": 10001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T273][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=16 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=162 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T274][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T275][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T276][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T277][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T278][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T279][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T280][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T281][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T282][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330797488
        },
        {
            "message": [
                "[T283][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=16 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330797488
        }
    ],
    "eventTimestamp": 1774330797309,
    "event": {
        "scheduledTime": "2026-03-24T05:39:57.487Z"
    }
}
{
    "wallTime": 209,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T284][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=17 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=172 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T285][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T286][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T287][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T288][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T289][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T290][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T291][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T292][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T293][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330807489
        },
        {
            "message": [
                "[T294][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=17 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330807489
        }
    ],
    "eventTimestamp": 1774330807389,
    "event": {
        "scheduledTime": "2026-03-24T05:40:07.488Z"
    }
}
{
    "wallTime": 9792,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330807489,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T295][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=18 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=182 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T296][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T297][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T298][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T299][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T300][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T301][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T302][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T303][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T304][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T305][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=18 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330817490
        },
        {
            "message": [
                "[T306][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330817490
        }
    ],
    "eventTimestamp": 1774330817484,
    "event": {
        "scheduledTime": "2026-03-24T05:40:17.489Z"
    }
}
{
    "wallTime": 5204,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T307][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=19 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=192 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T308][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T309][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T310][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T311][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T312][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T313][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T314][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T315][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T316][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330827491
        },
        {
            "message": [
                "[T317][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=19 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330827491
        }
    ],
    "eventTimestamp": 1774330827485,
    "event": {
        "scheduledTime": "2026-03-24T05:40:27.490Z"
    }
}
{
    "wallTime": 4795,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330827746,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T318][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=20 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=202 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T319][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T320][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T321][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T322][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T323][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T324][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T325][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T326][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T327][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T328][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=20 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330837491
        },
        {
            "message": [
                "[T329][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330837491
        }
    ],
    "eventTimestamp": 1774330837487,
    "event": {
        "scheduledTime": "2026-03-24T05:40:37.491Z"
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T330][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=21 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=212 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T331][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T332][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T333][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T334][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T335][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T336][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T337][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T338][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T339][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330847492
        },
        {
            "message": [
                "[T340][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=21 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330847492
        }
    ],
    "eventTimestamp": 1774330847487,
    "event": {
        "scheduledTime": "2026-03-24T05:40:47.491Z"
    }
}
{
    "wallTime": 198,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T341][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=22 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=222 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T342][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T343][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T344][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T345][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T346][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T347][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T348][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T349][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T350][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330857493
        },
        {
            "message": [
                "[T351][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=22 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330857493
        }
    ],
    "eventTimestamp": 1774330857488,
    "event": {
        "scheduledTime": "2026-03-24T05:40:57.492Z"
    }
}
{
    "wallTime": 9801,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330857493,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T352][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=23 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=232 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T353][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T354][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T355][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T356][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T357][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T358][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T359][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T360][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T361][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T362][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=23 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330867493
        },
        {
            "message": [
                "[T363][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330867493
        }
    ],
    "eventTimestamp": 1774330867489,
    "event": {
        "scheduledTime": "2026-03-24T05:41:07.493Z"
    }
}
{
    "wallTime": 5196,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T364][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=24 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=242 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T365][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T366][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T367][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T368][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T369][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T370][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T371][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T372][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T373][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330877494
        },
        {
            "message": [
                "[T374][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=24 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330877494
        }
    ],
    "eventTimestamp": 1774330877490,
    "event": {
        "scheduledTime": "2026-03-24T05:41:17.493Z"
    }
}
{
    "wallTime": 4804,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330877738,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T375][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=25 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=252 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T376][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T377][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T378][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T379][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T380][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T381][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T382][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T383][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T384][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T385][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=25 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330887495
        },
        {
            "message": [
                "[T386][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330887495
        }
    ],
    "eventTimestamp": 1774330887491,
    "event": {
        "scheduledTime": "2026-03-24T05:41:27.494Z"
    }
}
{
    "wallTime": 10001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T387][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=26 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=262 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T388][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T389][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T390][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T391][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T392][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T393][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T394][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T395][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T396][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330897496
        },
        {
            "message": [
                "[T397][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=26 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330897496
        }
    ],
    "eventTimestamp": 1774330897492,
    "event": {
        "scheduledTime": "2026-03-24T05:41:37.495Z"
    }
}
{
    "wallTime": 207,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T398][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=27 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=272 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T399][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T400][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T401][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T402][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T403][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T404][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T405][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T406][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T407][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330907497
        },
        {
            "message": [
                "[T408][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=27 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330907497
        }
    ],
    "eventTimestamp": 1774330907492,
    "event": {
        "scheduledTime": "2026-03-24T05:41:47.496Z"
    }
}
{
    "wallTime": 9792,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330907497,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T409][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=28 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=282 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T410][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T411][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T412][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T413][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T414][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T415][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T416][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T417][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T418][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T419][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=28 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330917497
        },
        {
            "message": [
                "[T420][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330917497
        }
    ],
    "eventTimestamp": 1774330917493,
    "event": {
        "scheduledTime": "2026-03-24T05:41:57.497Z"
    }
}
{
    "wallTime": 5199,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T421][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=29 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=292 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T422][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T423][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T424][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T425][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T426][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T427][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T428][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T429][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T430][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330927499
        },
        {
            "message": [
                "[T431][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=29 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330927499
        }
    ],
    "eventTimestamp": 1774330927493,
    "event": {
        "scheduledTime": "2026-03-24T05:42:07.497Z"
    }
}
{
    "wallTime": 4801,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330927753,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T432][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=30 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=302 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T433][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T434][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T435][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T436][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T437][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T438][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T439][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T440][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T441][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T442][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=30 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330937500
        },
        {
            "message": [
                "[T443][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330937500
        }
    ],
    "eventTimestamp": 1774330937494,
    "event": {
        "scheduledTime": "2026-03-24T05:42:17.499Z"
    }
}
{
    "wallTime": 10001,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T444][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=31 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=312 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T445][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T446][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T447][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T448][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T449][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T450][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T451][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T452][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T453][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330947502
        },
        {
            "message": [
                "[T454][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=31 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330947502
        }
    ],
    "eventTimestamp": 1774330947495,
    "event": {
        "scheduledTime": "2026-03-24T05:42:27.500Z"
    }
}
{
    "wallTime": 202,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T455][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=32 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=322 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T456][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T457][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T458][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T459][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T460][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T461][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T462][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T463][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T464][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330957503
        },
        {
            "message": [
                "[T465][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=32 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330957503
        }
    ],
    "eventTimestamp": 1774330957496,
    "event": {
        "scheduledTime": "2026-03-24T05:42:37.502Z"
    }
}
{
    "wallTime": 9799,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330957503,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T466][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=33 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=332 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T467][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T468][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T469][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T470][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T471][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T472][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T473][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T474][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T475][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T476][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=33 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330967504
        },
        {
            "message": [
                "[T477][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330967504
        }
    ],
    "eventTimestamp": 1774330967498,
    "event": {
        "scheduledTime": "2026-03-24T05:42:47.503Z"
    }
}
{
    "wallTime": 5220,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T478][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=34 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=342 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T479][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T480][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T481][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T482][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T483][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T484][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T485][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T486][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T487][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330977505
        },
        {
            "message": [
                "[T488][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=34 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330977505
        }
    ],
    "eventTimestamp": 1774330977498,
    "event": {
        "scheduledTime": "2026-03-24T05:42:57.504Z"
    }
}
{
    "wallTime": 4780,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774330977746,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T489][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=35 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=352 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T490][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T491][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T492][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T493][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T494][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T495][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T496][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T497][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T498][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T499][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=35 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330987506
        },
        {
            "message": [
                "[T500][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774330987506
        }
    ],
    "eventTimestamp": 1774330987499,
    "event": {
        "scheduledTime": "2026-03-24T05:43:07.505Z"
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T501][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=36 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=362 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T502][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T503][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T504][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T505][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T506][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T507][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T508][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T509][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T510][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774330997506
        },
        {
            "message": [
                "[T511][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=36 ms=0"
            ],
            "level": "log",
            "timestamp": 1774330997506
        }
    ],
    "eventTimestamp": 1774330997500,
    "event": {
        "scheduledTime": "2026-03-24T05:43:17.506Z"
    }
}
{
    "wallTime": 225,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T512][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=37 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=372 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T513][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T514][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T515][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T516][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T517][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T518][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T519][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T520][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T521][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774331007507
        },
        {
            "message": [
                "[T522][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=37 ms=0"
            ],
            "level": "log",
            "timestamp": 1774331007507
        }
    ],
    "eventTimestamp": 1774331007502,
    "event": {
        "scheduledTime": "2026-03-24T05:43:27.506Z"
    }
}
{
    "wallTime": 9775,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774331007507,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T523][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=38 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=382 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T524][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T525][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T526][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T527][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T528][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T529][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T530][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T531][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T532][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T533][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=38 ms=0"
            ],
            "level": "log",
            "timestamp": 1774331017508
        },
        {
            "message": [
                "[T534][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774331017508
        }
    ],
    "eventTimestamp": 1774331017503,
    "event": {
        "scheduledTime": "2026-03-24T05:43:37.507Z"
    }
}
{
    "wallTime": 5199,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T535][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=39 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=392 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T536][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T537][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T538][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T539][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T540][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T541][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T542][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T543][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T544][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774331027509
        },
        {
            "message": [
                "[T545][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=39 ms=0"
            ],
            "level": "log",
            "timestamp": 1774331027509
        }
    ],
    "eventTimestamp": 1774331027505,
    "event": {
        "scheduledTime": "2026-03-24T05:43:47.508Z"
    }
}
{
    "wallTime": 4801,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774331027747,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T546][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=40 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=402 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T547][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T548][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T549][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T550][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T551][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T552][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T553][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T554][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T555][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T556][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=40 ms=0"
            ],
            "level": "log",
            "timestamp": 1774331037510
        },
        {
            "message": [
                "[T557][ws][message] cid=campaign_mn46n4t1y51nb7 type=ping gen=true session=8a6f6259-2937-44cb-93a0-5e924c17ecb9"
            ],
            "level": "log",
            "timestamp": 1774331037510
        }
    ],
    "eventTimestamp": 1774331037505,
    "event": {
        "scheduledTime": "2026-03-24T05:43:57.509Z"
    }
}
{
    "wallTime": 10000,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T558][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=41 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=412 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T559][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T560][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T561][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T562][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T563][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T564][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T565][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T566][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T567][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774331047510
        },
        {
            "message": [
                "[T568][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=41 ms=0"
            ],
            "level": "log",
            "timestamp": 1774331047510
        }
    ],
    "eventTimestamp": 1774331047506,
    "event": {
        "scheduledTime": "2026-03-24T05:44:07.510Z"
    }
}
{
    "wallTime": 193,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
                "[T569][alarm][enter] cid=campaign_mn46n4t1y51nb7 iter=42 gen=true cid=campaign_mn46n4t1y51nb7 sandbox=true agent=proc_1774330630320_g840e8 ageSec=422 userId=user_3BNXbrQsVgKhrw9VYtzYjnMz38h wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T570][rpc][listProcesses.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T571][rpc][listProcesses.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T572][alarm][listProcesses.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T573][rpc][getProcessLogs.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T574][rpc][getProcessLogs.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T575][alarm][getProcessLogs.catch] cid=campaign_mn46n4t1y51nb7 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T576][rpc][readTurnResult.start] cid=campaign_mn46n4t1y51nb7"
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T577][rpc][readTurnResult.error] cid=campaign_mn46n4t1y51nb7 ms=0 err=Container service disconnected."
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T578][alarm][reschedule] cid=campaign_mn46n4t1y51nb7 nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774331057511
        },
        {
            "message": [
                "[T579][alarm][exit.ok] cid=campaign_mn46n4t1y51nb7 iter=42 ms=0"
            ],
            "level": "log",
            "timestamp": 1774331057511
        }
    ],
    "eventTimestamp": 1774331057507,
    "event": {
        "scheduledTime": "2026-03-24T05:44:17.510Z"
    }
}
{
    "wallTime": 9807,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8513fe4b9bbf64b17f529a46b34e7c8b241d52ced266dfb3b5400b3c4b1cdf59",
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
    "eventTimestamp": 1774331057511,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}