Last login: Sun Apr  5 12:30:48 on ttys001
chakra@chakras-MacBook-Air creative_agent % cd cloudflare && npx wrangler tail --env staging --format json
{
    "wallTime": 0,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "WS closed: session=c0550ec9-3c85-4871-bffe-0369aee486e7, code=1001, reason="
            ],
            "level": "log",
            "timestamp": 1775459134558
        }
    ],
    "eventTimestamp": 1775459133565,
    "event": {
        "getWebSocketEvent": {
            "wasClean": true,
            "code": 1001,
            "webSocketEventType": "close"
        }
    }
}
{
    "wallTime": 12,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "responseStreamDisconnected",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459133552,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/ws?token=REDACTED.REDACTED.REDACTED",
            "method": "GET",
            "headers": {
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef1dc58252cea",
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
                "x-real-ip": "175.101.96.191",
                "x-user-id": "user_38uxIJdRftKkSkstogHasnk6c2J"
            },
            "cf": {
                "clientTcpRtt": 16,
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
                "tlsClientCiphersSha1": "KWYhMQGl/AEYTQjYkuI539ith4I=",
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
                "tlsClientRandom": "cXAG6RGBCyYQBpWyOHrvv1iKZwASq4JpBDuiu/N8ss4=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "5b79ae8f57e13a20fff6110a239857307fa1a22abeea4185c76708f16e8b710c",
                    "clientHandshake": "97d2458d6aae6fe3d3a5a8a8c4154d6a443f5d70c16106fdaaba50908918c6ff",
                    "serverHandshake": "9bfe2c6698d0925f6cb08ecccf3826b7bfa475960209d13da1109bad3d12e30c",
                    "serverFinished": "fdd1644361269d810649776b3b942c98fb903da3b2f33fbf46cd2b62528e5ea1"
                },
                "tlsClientHelloLength": "2040",
                "colo": "HYD",
                "timezone": "Asia/Kolkata",
                "longitude": "80.64660",
                "latitude": "16.50745",
                "edgeRequestKeepAliveStatus": 1,
                "requestPriority": "",
                "postalCode": "520004",
                "city": "Vijayawada",
                "tlsVersion": "TLSv1.3",
                "regionCode": "AP",
                "asOrganization": "Excell Media Pvt Ltd",
                "tlsClientExtensionsSha1Le": "7JMHA6q0VHsSBiZyl5bTqmYuKss=",
                "tlsClientExtensionsSha1": "sgNZ0yN1vR4Dx2Y2FI5tVBdv9Bk=",
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
    "wallTime": 186,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "canceled",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459133382
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459133541
        },
        {
            "message": [
                "[trace][worker][ws_auth] userId=user_38uxIJdRftKkSkstogHasnk6c2J tokenPresent=true"
            ],
            "level": "log",
            "timestamp": 1775459133541
        },
        {
            "message": [
                "[trace][worker][ws_forward] userId=user_38uxIJdRftKkSkstogHasnk6c2J"
            ],
            "level": "log",
            "timestamp": 1775459133541
        }
    ],
    "eventTimestamp": 1775459133297,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/ws?token=REDACTED.REDACTED.REDACTED",
            "method": "GET",
            "headers": {
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "cache-control": "no-cache",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef1dc58252cea",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "clientTcpRtt": 16,
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
                "tlsClientCiphersSha1": "KWYhMQGl/AEYTQjYkuI539ith4I=",
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
                "tlsClientRandom": "cXAG6RGBCyYQBpWyOHrvv1iKZwASq4JpBDuiu/N8ss4=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "5b79ae8f57e13a20fff6110a239857307fa1a22abeea4185c76708f16e8b710c",
                    "clientHandshake": "97d2458d6aae6fe3d3a5a8a8c4154d6a443f5d70c16106fdaaba50908918c6ff",
                    "serverHandshake": "9bfe2c6698d0925f6cb08ecccf3826b7bfa475960209d13da1109bad3d12e30c",
                    "serverFinished": "fdd1644361269d810649776b3b942c98fb903da3b2f33fbf46cd2b62528e5ea1"
                },
                "tlsClientHelloLength": "2040",
                "colo": "HYD",
                "timezone": "Asia/Kolkata",
                "longitude": "80.64660",
                "latitude": "16.50745",
                "edgeRequestKeepAliveStatus": 1,
                "requestPriority": "",
                "postalCode": "520004",
                "city": "Vijayawada",
                "tlsVersion": "TLSv1.3",
                "regionCode": "AP",
                "asOrganization": "Excell Media Pvt Ltd",
                "tlsClientExtensionsSha1Le": "7JMHA6q0VHsSBiZyl5bTqmYuKss=",
                "tlsClientExtensionsSha1": "sgNZ0yN1vR4Dx2Y2FI5tVBdv9Bk=",
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
    "wallTime": 842,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns"
            ],
            "level": "log",
            "timestamp": 1775459159774
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459159897
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns status=200"
            ],
            "level": "log",
            "timestamp": 1775459160612
        }
    ],
    "eventTimestamp": 1775459159653,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef2830a1cc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 30,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 82068
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
    "wallTime": 857,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/credits"
            ],
            "level": "log",
            "timestamp": 1775459159758
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459160055
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/credits status=200"
            ],
            "level": "log",
            "timestamp": 1775459160611
        }
    ],
    "eventTimestamp": 1775459159650,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/credits",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef2830a1ec1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 30,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 82068
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
    "wallTime": 856,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/assets/folders"
            ],
            "level": "log",
            "timestamp": 1775459159758
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459159931
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/assets/folders status=200"
            ],
            "level": "log",
            "timestamp": 1775459160610
        }
    ],
    "eventTimestamp": 1775459159661,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/assets/folders",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef2830a1dc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 30,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 82068
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
    "wallTime": 513,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mnk3n6q79ywfyh"
            ],
            "level": "log",
            "timestamp": 1775459160905
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459160933
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mnk3n6q79ywfyh status=200"
            ],
            "level": "log",
            "timestamp": 1775459161404
        }
    ],
    "eventTimestamp": 1775459160905,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnk3n6q79ywfyh",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aeadcc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 517,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mnley0703652hq"
            ],
            "level": "log",
            "timestamp": 1775459160994
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459161034
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mnley0703652hq status=200"
            ],
            "level": "log",
            "timestamp": 1775459161503
        }
    ],
    "eventTimestamp": 1775459160906,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnley0703652hq",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aead9c1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 608,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn4jrerwvme6c1"
            ],
            "level": "log",
            "timestamp": 1775459161000
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459161129
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn4jrerwvme6c1 status=200"
            ],
            "level": "log",
            "timestamp": 1775459161596
        }
    ],
    "eventTimestamp": 1775459160910,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn4jrerwvme6c1",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aeadfc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 543,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mna7uu5feghfkc"
            ],
            "level": "log",
            "timestamp": 1775459161034
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459161090
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mna7uu5feghfkc status=200"
            ],
            "level": "log",
            "timestamp": 1775459161563
        }
    ],
    "eventTimestamp": 1775459160910,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mna7uu5feghfkc",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aeadec1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 1015,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mnka70u46w19q8"
            ],
            "level": "log",
            "timestamp": 1775459160998
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459161152
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mnka70u46w19q8 status=200"
            ],
            "level": "log",
            "timestamp": 1775459162006
        }
    ],
    "eventTimestamp": 1775459160920,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnka70u46w19q8",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aeadac1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 1082,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mnk0akmd6dutr5"
            ],
            "level": "log",
            "timestamp": 1775459160988
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459161148
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mnk0akmd6dutr5 status=200"
            ],
            "level": "log",
            "timestamp": 1775459162061
        }
    ],
    "eventTimestamp": 1775459160943,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnk0akmd6dutr5",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aeaddc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 1092,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mnk2brzknp4ue5"
            ],
            "level": "log",
            "timestamp": 1775459160987
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459161150
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mnk2brzknp4ue5 status=200"
            ],
            "level": "log",
            "timestamp": 1775459162072
        }
    ],
    "eventTimestamp": 1775459160914,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnk2brzknp4ue5",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef28aeadbc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
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
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 25,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 115491
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
    "wallTime": 498,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=DELETE path=/api/campaigns/campaign_mnley0703652hq"
            ],
            "level": "log",
            "timestamp": 1775459171277
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459171312
        },
        {
            "message": [
                "[trace][worker][api_done] method=DELETE path=/api/campaigns/campaign_mnley0703652hq status=200"
            ],
            "level": "log",
            "timestamp": 1775459171771
        }
    ],
    "eventTimestamp": 1775459171199,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnley0703652hq",
            "method": "DELETE",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef2cb3cd1c1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-length": "0",
                "content-type": "application/json",
                "cookie": "REDACTED",
                "host": "creative-agent-staging.alphasapien17.workers.dev",
                "origin": "https://creative-agent-staging.alphasapien17.workers.dev",
                "priority": "u=1, i",
                "referer": "https://creative-agent-staging.alphasapien17.workers.dev/workspace",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 28,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 306237
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
    "wallTime": 520,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=DELETE path=/api/campaigns/campaign_mnk3n6q79ywfyh"
            ],
            "level": "log",
            "timestamp": 1775459173455
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_38uxIJdRftKkSkstogHasnk6c2J, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1775459173507
        },
        {
            "message": [
                "[trace][worker][api_done] method=DELETE path=/api/campaigns/campaign_mnk3n6q79ywfyh status=200"
            ],
            "level": "log",
            "timestamp": 1775459173971
        }
    ],
    "eventTimestamp": 1775459173455,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mnk3n6q79ywfyh",
            "method": "DELETE",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.191",
                "cf-ipcountry": "IN",
                "cf-ray": "9e7ef2d95e5dc1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-length": "0",
                "content-type": "application/json",
                "cookie": "REDACTED",
                "host": "creative-agent-staging.alphasapien17.workers.dev",
                "origin": "https://creative-agent-staging.alphasapien17.workers.dev",
                "priority": "u=1, i",
                "referer": "https://creative-agent-staging.alphasapien17.workers.dev/workspace",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36",
                "x-forwarded-proto": "https",
                "x-real-ip": "175.101.96.191"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
                "clientQuicRtt": 29,
                "colo": "HYD",
                "asn": 17754,
                "asOrganization": "Excell Media Pvt Ltd",
                "country": "IN",
                "isEUCountry": false,
                "city": "Vijayawada",
                "continent": "AS",
                "region": "Andhra Pradesh",
                "regionCode": "AP",
                "timezone": "Asia/Kolkata",
                "longitude": "80.6466",
                "latitude": "16.50745",
                "postalCode": "520004",
                "tlsVersion": "TLSv1.3",
                "tlsCipher": "AEAD-AES128-GCM-SHA256",
                "tlsClientRandom": "duNc5NTu8Byaoc6T5EYTD/sIENtE2UojOH+40D2vRQU=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "RtyDPjJeW6rh3Ulwg+XyaTD2u2A=",
                "tlsClientExtensionsSha1Le": "JQ6iDHZ7ACVZ5pxqCGh6B5Yf6yI=",
                "tlsClientHelloLength": "1960",
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
                    "certNotAfter": "",
                    "certRFC9440": "",
                    "certRFC9440TooLarge": false,
                    "certChainRFC9440": "",
                    "certChainRFC9440TooLarge": false
                },
                "verifiedBotCategory": "",
                "edgeL4": {
                    "deliveryRate": 306237
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
    "wallTime": 5,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459159852,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 437,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459188234,
    "event": {
        "rpcMethod": "cleanupCompletedProcesses"
    }
}
{
    "wallTime": 436,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459188100,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 1042,
    "cpuTime": 9,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459188883
        },
        {
            "message": [
                "Error checking 3000: The container is not listening in the TCP address 10.0.0.1:3000"
            ],
            "level": "debug",
            "timestamp": 1775459189215
        },
        {
            "message": [
                "Port 3000 is ready"
            ],
            "level": "log",
            "timestamp": 1775459189556
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Version retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"unknown\",\"timestamp\":\"2026-04-06T07:06:29.610Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189610
        },
        {
            "message": [
                "{\"level\":\"warn\",\"msg\":\"Container version check: Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.19\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"timestamp\":\"2026-04-06T07:06:29.610Z\"}"
            ],
            "level": "warn",
            "timestamp": 1775459189610
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Session created\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"ID: sandbox-user-user_38uxijdrftkkskstoghasnk6c2j-v2\",\"timestamp\":\"2026-04-06T07:06:29.614Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189614
        }
    ],
    "eventTimestamp": 1775459188655,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 13,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Unmounting bucket from /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"timestamp\":\"2026-04-06T07:06:29.717Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189717
        }
    ],
    "eventTimestamp": 1775459189704,
    "event": {
        "rpcMethod": "unmountBucket"
    }
}
{
    "wallTime": 100,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2, Success: true\",\"timestamp\":\"2026-04-06T07:06:29.818Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189818
        }
    ],
    "eventTimestamp": 1775459189717,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 294,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Mounting bucket creative-agent-assets to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"timestamp\":\"2026-04-06T07:06:29.830Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189830
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"/tmp/.passwd-s3fs-e6278efa-326c-4976-820a-2fa9ef6d85b0 (119 chars)\",\"timestamp\":\"2026-04-06T07:06:29.865Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189865
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"chmod 0600 '/tmp/.passwd-s3fs-e6278efa-326c-4976-820a-2fa9ef6d85b0', Success: true\",\"timestamp\":\"2026-04-06T07:06:29.906Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189906
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"mkdir -p '/mnt/r2', Success: true\",\"timestamp\":\"2026-04-06T07:06:29.946Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189946
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"s3fs 'creative-agent-assets:/users/user_38uxIJdRftKkSkstogHasnk6c2J' '/mnt/r2' -o 'passwd_file=/tmp/.passwd-s3fs-e6278efa-326c-4976-820a-2fa9ef6d85b0,nomixupload,url=https://091650847ca6a1d9bb40bee044dfdc91.r2.cloudflarestorage.com', Success: true\",\"timestamp\":\"2026-04-06T07:06:30.109Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459190109
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Successfully mounted bucket creative-agent-assets to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"timestamp\":\"2026-04-06T07:06:30.109Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459190109
        }
    ],
    "eventTimestamp": 1775459189818,
    "event": {
        "rpcMethod": "mountBucket"
    }
}
{
    "wallTime": 2432,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"node -e \\\"\\n          async function test() {\\n            const r1 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});\\n            console.log('WITH_KEY='+r1.status);\\n            const r3 = await fetch('https://httpbin.org/ip');\\n            const t3 = await r3.text();\\n            console.log('IP='+t3.trim());\\n          }\\n          test().catch(e=>console.log('ERR='+e.message));\\n        \\\", Success: true\",\"timestamp\":\"2026-04-06T07:06:32.556Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459192556
        }
    ],
    "eventTimestamp": 1775459190109,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 55,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"rm -f /app/generated-images.jsonl /app/turn-result.json 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-04-06T07:06:32.610Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459192610
        }
    ],
    "eventTimestamp": 1775459192556,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 98,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"rm -rf /app/agent/files/* 2>/dev/null; rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-04-06T07:06:32.707Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459192707
        }
    ],
    "eventTimestamp": 1775459192610,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 46,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"ID: proc_1775459192303_5p18w4, stdout: 2040 chars, stderr: 0 chars\",\"timestamp\":\"2026-04-06T07:06:37.680Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459197680
        }
    ],
    "eventTimestamp": 1775459197635,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10048,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459197680,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 58,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"ID: proc_1775459192303_5p18w4, stdout: 5352 chars, stderr: 0 chars\",\"timestamp\":\"2026-04-06T07:06:47.834Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459207834
        }
    ],
    "eventTimestamp": 1775459207776,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 2101,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"/app/turn-result.json (1133 chars)\",\"timestamp\":\"2026-04-06T07:06:47.880Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459207880
        }
    ],
    "eventTimestamp": 1775459207834,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 2906,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459210033,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 4524,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"rm -f /app/turn-result.json, Success: true\",\"timestamp\":\"2026-04-06T07:06:50.035Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459210035
        }
    ],
    "eventTimestamp": 1775459208075,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 484,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"/app/agent-status.json (53 chars)\",\"timestamp\":\"2026-04-06T07:06:54.556Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459214556
        }
    ],
    "eventTimestamp": 1775459214514,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 9400,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"/app/next-prompt.json (362 chars)\",\"timestamp\":\"2026-04-06T07:06:55.089Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459215089
        }
    ],
    "eventTimestamp": 1775459215049,
    "event": {
        "rpcMethod": "writeFile"
    }
}
{
    "wallTime": 69,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"ID: proc_1775459192303_5p18w4, stdout: 11274 chars, stderr: 0 chars\",\"timestamp\":\"2026-04-06T07:07:04.562Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459224562
        }
    ],
    "eventTimestamp": 1775459224494,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 2320,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File read\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"/app/turn-result.json (1344 chars)\",\"timestamp\":\"2026-04-06T07:07:04.604Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459224604
        }
    ],
    "eventTimestamp": 1775459224562,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 25043,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459253110
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459253111
        }
    ],
    "eventTimestamp": 1775459226977,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24955,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459283134
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459283135
        }
    ],
    "eventTimestamp": 1775459257685,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459284569,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 25059,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459313157
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459313158
        }
    ],
    "eventTimestamp": 1775459286882,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24926,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459343079
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459343080
        }
    ],
    "eventTimestamp": 1775459313158,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180012,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"pkill -f agent-runner 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-04-06T07:06:29.692Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459189692
        }
    ],
    "eventTimestamp": 1775459189632,
    "event": {
        "scheduledTime": "2026-04-06T07:06:29.666Z"
    }
}
{
    "wallTime": 142807,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725\",\"traceId\":\"tr_ba2130fc91534c07\",\"details\":\"rm -f /app/turn-result.json, Success: true\",\"timestamp\":\"2026-04-06T07:07:06.980Z\"}"
            ],
            "level": "log",
            "timestamp": 1775459226980
        }
    ],
    "eventTimestamp": 1775459224810,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 25030,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459373105
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459373107
        }
    ],
    "eventTimestamp": 1775459343080,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24965,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459403124
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459403126
        }
    ],
    "eventTimestamp": 1775459373107,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24991,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459433142
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459433143
        }
    ],
    "eventTimestamp": 1775459403126,
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
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459433143,
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
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459463160
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459463161
        }
    ],
    "eventTimestamp": 1775459435422,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 24992,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459493078
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459493080
        }
    ],
    "eventTimestamp": 1775459463161,
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
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459523096
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459523097
        }
    ],
    "eventTimestamp": 1775459493080,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 180030,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "8d0a68cbe8e2a5f3ded2e88780e703f4da7656dd55f69f3135a31d9acc860725",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1775459369683,
    "event": {
        "scheduledTime": "2026-04-06T07:09:29.666Z"
    }
}
{
    "wallTime": 25914,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "e7aaef943fc7eb65b26420adc9c6ca74cb6fb47aa842742b80af3d8722619428",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "30803e15-ee82-4cf2-a83a-bf05a38a4a09"
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
            "timestamp": 1775459553112
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1775459553113
        }
    ],
    "eventTimestamp": 1775459523097,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}