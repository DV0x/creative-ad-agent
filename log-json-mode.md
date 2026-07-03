Last login: Mon Mar 23 17:11:12 on ttys000
chakra@chakras-MacBook-Air creative_agent % npx wrangler tail creative-agent-staging --format json
{
    "wallTime": 710,
    "cpuTime": 8,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
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
            "timestamp": 1774276401887
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276402120
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/assets/folders status=200"
            ],
            "level": "log",
            "timestamp": 1774276402583
        }
    ],
    "eventTimestamp": 1774276401716,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/assets/folders",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e2695ea482ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 444,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
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
            "timestamp": 1774276401807
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276401887
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns status=200"
            ],
            "level": "log",
            "timestamp": 1774276402247
        }
    ],
    "eventTimestamp": 1774276401714,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e2695da472ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 563,
    "cpuTime": 7,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/assets/folders/folder_mn0b9j9u9pjgg5/files"
            ],
            "level": "log",
            "timestamp": 1774276403123
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276403216
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/assets/folders/folder_mn0b9j9u9pjgg5/files status=200"
            ],
            "level": "log",
            "timestamp": 1774276403674
        }
    ],
    "eventTimestamp": 1774276402913,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/assets/folders/folder_mn0b9j9u9pjgg5/files",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e269d5b3c2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 611,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn308y6w6e43dw"
            ],
            "level": "log",
            "timestamp": 1774276404096
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404198
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn308y6w6e43dw status=200"
            ],
            "level": "log",
            "timestamp": 1774276404688
        }
    ],
    "eventTimestamp": 1774276404096,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn308y6w6e43dw",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4cc0b2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 566,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmiqbkuqgchi26"
            ],
            "level": "log",
            "timestamp": 1774276404213
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404264
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmiqbkuqgchi26 status=200"
            ],
            "level": "log",
            "timestamp": 1774276404765
        }
    ],
    "eventTimestamp": 1774276404213,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmiqbkuqgchi26",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a56c2f2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 561,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmd1im8zziio3s"
            ],
            "level": "log",
            "timestamp": 1774276404238
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404327
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmd1im8zziio3s status=200"
            ],
            "level": "log",
            "timestamp": 1774276404779
        }
    ],
    "eventTimestamp": 1774276404221,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmd1im8zziio3s",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a58c3a2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 587,
    "cpuTime": 8,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmg824jxek6lt7"
            ],
            "level": "log",
            "timestamp": 1774276404224
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404281
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmg824jxek6lt7 status=200"
            ],
            "level": "log",
            "timestamp": 1774276404791
        }
    ],
    "eventTimestamp": 1774276404198,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmg824jxek6lt7",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a57c322ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 663,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmn8ey42ko4ril"
            ],
            "level": "log",
            "timestamp": 1774276404199
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404383
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmn8ey42ko4ril status=200"
            ],
            "level": "log",
            "timestamp": 1774276404848
        }
    ],
    "eventTimestamp": 1774276404153,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmn8ey42ko4ril",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a52c212ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 902,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmzzzc6dg9e730"
            ],
            "level": "log",
            "timestamp": 1774276404109
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404178
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmzzzc6dg9e730 status=200"
            ],
            "level": "log",
            "timestamp": 1774276404999
        }
    ],
    "eventTimestamp": 1774276404109,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmzzzc6dg9e730",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4ec132ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 957,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmnc8k102dqipu"
            ],
            "level": "log",
            "timestamp": 1774276404116
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404179
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmnc8k102dqipu status=200"
            ],
            "level": "log",
            "timestamp": 1774276405064
        }
    ],
    "eventTimestamp": 1774276404116,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmnc8k102dqipu",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4fc1a2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 910,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmdd0rkagvj3ik"
            ],
            "level": "log",
            "timestamp": 1774276404209
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404256
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmdd0rkagvj3ik status=200"
            ],
            "level": "log",
            "timestamp": 1774276405107
        }
    ],
    "eventTimestamp": 1774276404209,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmdd0rkagvj3ik",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a58c392ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 909,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmdj53j24654t1"
            ],
            "level": "log",
            "timestamp": 1774276404221
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404278
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmdj53j24654t1 status=200"
            ],
            "level": "log",
            "timestamp": 1774276405115
        }
    ],
    "eventTimestamp": 1774276404221,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmdj53j24654t1",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a57c382ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 654,
    "cpuTime": 9,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmep6rpuem9988"
            ],
            "level": "log",
            "timestamp": 1774276404363
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404430
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmep6rpuem9988 status=200"
            ],
            "level": "log",
            "timestamp": 1774276404993
        }
    ],
    "eventTimestamp": 1774276404221,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmep6rpuem9988",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a57c342ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 707,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmekaqthgeddbd"
            ],
            "level": "log",
            "timestamp": 1774276404317
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404453
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmekaqthgeddbd status=200"
            ],
            "level": "log",
            "timestamp": 1774276405010
        }
    ],
    "eventTimestamp": 1774276404203,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmekaqthgeddbd",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a57c362ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 730,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmdorkk2j72msz"
            ],
            "level": "log",
            "timestamp": 1774276404306
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404552
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmdorkk2j72msz status=200"
            ],
            "level": "log",
            "timestamp": 1774276405024
        }
    ],
    "eventTimestamp": 1774276404207,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmdorkk2j72msz",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a57c372ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 922,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmsqgwb4u6jv1i"
            ],
            "level": "log",
            "timestamp": 1774276404206
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404304
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmsqgwb4u6jv1i status=200"
            ],
            "level": "log",
            "timestamp": 1774276405116
        }
    ],
    "eventTimestamp": 1774276404112,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmsqgwb4u6jv1i",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4fc162ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 977,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmivoxx6wt4tzi"
            ],
            "level": "log",
            "timestamp": 1774276404184
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404253
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmivoxx6wt4tzi status=200"
            ],
            "level": "log",
            "timestamp": 1774276405149
        }
    ],
    "eventTimestamp": 1774276404184,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmivoxx6wt4tzi",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a56c2b2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 793,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmnivzy5hea06s"
            ],
            "level": "log",
            "timestamp": 1774276404222
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404470
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmnivzy5hea06s status=200"
            ],
            "level": "log",
            "timestamp": 1774276405005
        }
    ],
    "eventTimestamp": 1774276404121,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmnivzy5hea06s",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4fc172ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 966,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmoh48kqgxuip7"
            ],
            "level": "log",
            "timestamp": 1774276404224
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404497
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmoh48kqgxuip7 status=200"
            ],
            "level": "log",
            "timestamp": 1774276405180
        }
    ],
    "eventTimestamp": 1774276404115,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmoh48kqgxuip7",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4fc192ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 866,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmjfnkiob8oqlc"
            ],
            "level": "log",
            "timestamp": 1774276404259
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404456
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmjfnkiob8oqlc status=200"
            ],
            "level": "log",
            "timestamp": 1774276405107
        }
    ],
    "eventTimestamp": 1774276404189,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmjfnkiob8oqlc",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a55c282ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1018,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn00erml9ymowq"
            ],
            "level": "log",
            "timestamp": 1774276404204
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404353
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn00erml9ymowq status=200"
            ],
            "level": "log",
            "timestamp": 1774276405214
        }
    ],
    "eventTimestamp": 1774276404107,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn00erml9ymowq",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4dc122ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1007,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn31ldtyyqjlmu"
            ],
            "level": "log",
            "timestamp": 1774276404222
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404642
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn31ldtyyqjlmu status=200"
            ],
            "level": "log",
            "timestamp": 1774276405212
        }
    ],
    "eventTimestamp": 1774276404083,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn31ldtyyqjlmu",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4cc082ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1008,
    "cpuTime": 8,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn2navtvy1lwil"
            ],
            "level": "log",
            "timestamp": 1774276404236
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404322
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn2navtvy1lwil status=200"
            ],
            "level": "log",
            "timestamp": 1774276405227
        }
    ],
    "eventTimestamp": 1774276404097,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn2navtvy1lwil",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4dc0e2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1052,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmish1za1dvtgn"
            ],
            "level": "log",
            "timestamp": 1774276404206
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404408
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmish1za1dvtgn status=200"
            ],
            "level": "log",
            "timestamp": 1774276405248
        }
    ],
    "eventTimestamp": 1774276404190,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmish1za1dvtgn",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a56c2e2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 994,
    "cpuTime": 7,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn30njnn76dvux"
            ],
            "level": "log",
            "timestamp": 1774276404265
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404711
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn30njnn76dvux status=200"
            ],
            "level": "log",
            "timestamp": 1774276405241
        }
    ],
    "eventTimestamp": 1774276404107,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn30njnn76dvux",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4cc0a2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1095,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn2siwzvg2o58f"
            ],
            "level": "log",
            "timestamp": 1774276404198
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404454
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn2siwzvg2o58f status=200"
            ],
            "level": "log",
            "timestamp": 1774276405281
        }
    ],
    "eventTimestamp": 1774276404092,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn2siwzvg2o58f",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4dc0d2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1162,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmjhc532qhpnlb"
            ],
            "level": "log",
            "timestamp": 1774276404206
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404443
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmjhc532qhpnlb status=200"
            ],
            "level": "log",
            "timestamp": 1774276405360
        }
    ],
    "eventTimestamp": 1774276404172,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmjhc532qhpnlb",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a53c262ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 999,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmisy8bkjitacq"
            ],
            "level": "log",
            "timestamp": 1774276404360
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404658
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmisy8bkjitacq status=200"
            ],
            "level": "log",
            "timestamp": 1774276405348
        }
    ],
    "eventTimestamp": 1774276404204,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmisy8bkjitacq",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a56c2c2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1112,
    "cpuTime": 8,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mn02da53tzj8ri"
            ],
            "level": "log",
            "timestamp": 1774276404257
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404451
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mn02da53tzj8ri status=200"
            ],
            "level": "log",
            "timestamp": 1774276405353
        }
    ],
    "eventTimestamp": 1774276404101,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mn02da53tzj8ri",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4dc0f2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1175,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmnm5eoj02ek47"
            ],
            "level": "log",
            "timestamp": 1774276404225
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404523
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmnm5eoj02ek47 status=200"
            ],
            "level": "log",
            "timestamp": 1774276405391
        }
    ],
    "eventTimestamp": 1774276404120,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmnm5eoj02ek47",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4fc182ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1117,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmk9ieo7923b5x"
            ],
            "level": "log",
            "timestamp": 1774276404262
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404431
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmk9ieo7923b5x status=200"
            ],
            "level": "log",
            "timestamp": 1774276405372
        }
    ],
    "eventTimestamp": 1774276404170,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmk9ieo7923b5x",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a53c272ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1100,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmj2itkq245fr7"
            ],
            "level": "log",
            "timestamp": 1774276404264
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404396
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmj2itkq245fr7 status=200"
            ],
            "level": "log",
            "timestamp": 1774276405354
        }
    ],
    "eventTimestamp": 1774276404187,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmj2itkq245fr7",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a55c2a2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1127,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmgcw4bl0nqmxw"
            ],
            "level": "log",
            "timestamp": 1774276404264
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404426
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmgcw4bl0nqmxw status=200"
            ],
            "level": "log",
            "timestamp": 1774276405376
        }
    ],
    "eventTimestamp": 1774276404200,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmgcw4bl0nqmxw",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a56c302ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1121,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmn8mcmh9wyrwu"
            ],
            "level": "log",
            "timestamp": 1774276404265
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404414
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmn8mcmh9wyrwu status=200"
            ],
            "level": "log",
            "timestamp": 1774276405376
        }
    ],
    "eventTimestamp": 1774276404153,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmn8mcmh9wyrwu",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a52c222ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1182,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmu87bsw93x4in"
            ],
            "level": "log",
            "timestamp": 1774276404260
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404575
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmu87bsw93x4in status=200"
            ],
            "level": "log",
            "timestamp": 1774276405426
        }
    ],
    "eventTimestamp": 1774276404126,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmu87bsw93x4in",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a4ec142ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 967,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmc4lmcnxahaeq"
            ],
            "level": "log",
            "timestamp": 1774276404648
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404689
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmc4lmcnxahaeq status=200"
            ],
            "level": "log",
            "timestamp": 1774276405607
        }
    ],
    "eventTimestamp": 1774276404648,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmc4lmcnxahaeq",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a58c3b2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1089,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmn1jj0v52oopi"
            ],
            "level": "log",
            "timestamp": 1774276404265
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404394
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmn1jj0v52oopi status=200"
            ],
            "level": "log",
            "timestamp": 1774276405345
        }
    ],
    "eventTimestamp": 1774276404165,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmn1jj0v52oopi",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a52c252ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 1050,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/api/campaigns/campaign_mmn3vonf7qgqm6"
            ],
            "level": "log",
            "timestamp": 1774276404265
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276404392
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns/campaign_mmn3vonf7qgqm6 status=200"
            ],
            "level": "log",
            "timestamp": 1774276405303
        }
    ],
    "eventTimestamp": 1774276404157,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/api/campaigns/campaign_mmn3vonf7qgqm6",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26a52c242ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 473,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=GET path=/images/1774262033020_1_create_a_4_5_social_media_ad_image_1080x1350px_for.png"
            ],
            "level": "log",
            "timestamp": 1774276406744
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3ANzBpk1WdE1QZOshOLhHK8EAfI, iss=https://well-bug-49.clerk.accounts.dev"
            ],
            "level": "log",
            "timestamp": 1774276406830
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/images/1774262033020_1_create_a_4_5_social_media_ad_image_1080x1350px_for.png status=200"
            ],
            "level": "log",
            "timestamp": 1774276407217
        }
    ],
    "eventTimestamp": 1774276406744,
    "event": {
        "request": {
            "url": "https://creative-agent-staging.alphasapien17.workers.dev/images/1774262033020_1_create_a_4_5_social_media_ad_image_1080x1350px_for.png",
            "method": "GET",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e26b55d9d2ceb",
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
                "x-real-ip": "175.101.96.182"
            },
            "cf": {
                "httpProtocol": "HTTP/3",
                "clientAcceptEncoding": "gzip, deflate, br",
                "requestPriority": "",
                "edgeRequestKeepAliveStatus": 1,
                "requestHeaderNames": {},
                "clientTcpRtt": 0,
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
                "tlsClientRandom": "DjVeXu4OZUasusf5ApHBWIj7Q0jrFyHGFXGDrD6kLu8=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "knVbyUeVwJEEa8eOhO823Q0Rdw4=",
                "tlsClientExtensionsSha1Le": "zoHYvNFsLAWSBQ+4YuM3uL9z7sI=",
                "tlsClientHelloLength": "2050",
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
    "wallTime": 7,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276402242,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 442,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276438344,
    "event": {
        "rpcMethod": "cleanupCompletedProcesses"
    }
}
{
    "wallTime": 442,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276438344,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 442,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276438213,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 1465,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
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
            "timestamp": 1774276439111
        }
    ],
    "eventTimestamp": 1774276438759,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 3,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Unmounting bucket from /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"timestamp\":\"2026-03-23T14:34:00.248Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440248
        }
    ],
    "eventTimestamp": 1774276440246,
    "event": {
        "rpcMethod": "unmountBucket"
    }
}
{
    "wallTime": 448,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2, Success: true\",\"timestamp\":\"2026-03-23T14:34:00.697Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440697
        }
    ],
    "eventTimestamp": 1774276440248,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 287,
    "cpuTime": 4,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Mounting bucket creative-agent-assets to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"timestamp\":\"2026-03-23T14:34:00.700Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440700
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"/tmp/.passwd-s3fs-f13c03bf-43d1-4e33-9304-0d798642d7c3 (119 chars)\",\"timestamp\":\"2026-03-23T14:34:00.709Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440709
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"chmod 0600 '/tmp/.passwd-s3fs-f13c03bf-43d1-4e33-9304-0d798642d7c3', Success: true\",\"timestamp\":\"2026-03-23T14:34:00.728Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440728
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"mkdir -p '/mnt/r2', Success: true\",\"timestamp\":\"2026-03-23T14:34:00.786Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440786
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"s3fs 'creative-agent-assets:/users/user_3ANzBpk1WdE1QZOshOLhHK8EAfI' '/mnt/r2' -o 'passwd_file=/tmp/.passwd-s3fs-f13c03bf-43d1-4e33-9304-0d798642d7c3,nomixupload,url=https://091650847ca6a1d9bb40bee044dfdc91.r2.cloudflarestorage.com', Success: true\",\"timestamp\":\"2026-03-23T14:34:00.981Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440981
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Successfully mounted bucket creative-agent-assets to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"timestamp\":\"2026-03-23T14:34:00.981Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440981
        }
    ],
    "eventTimestamp": 1774276440697,
    "event": {
        "rpcMethod": "mountBucket"
    }
}
{
    "wallTime": 10306,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"rm -f /mnt/r2/.claude/.credentials /mnt/r2/.claude/config.json /mnt/r2/.claude/auth.json 2>/dev/null; ls -la /mnt/r2/.claude/ 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-23T14:34:11.296Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276451296
        }
    ],
    "eventTimestamp": 1774276440981,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 11068,
    "cpuTime": 12,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276428405,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 1208,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"node -e \\\"\\n          async function test() {\\n            const r1 = await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:5,messages:[{role:'user',content:'hi'}]})});\\n            console.log('WITH_KEY='+r1.status);\\n            const r3 = await fetch('https://httpbin.org/ip');\\n            const t3 = await r3.text();\\n            console.log('IP='+t3.trim());\\n          }\\n          test().catch(e=>console.log('ERR='+e.message));\\n        \\\", Success: true\",\"timestamp\":\"2026-03-23T14:34:12.506Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276452506
        }
    ],
    "eventTimestamp": 1774276451296,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 61,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"rm -f /app/generated-images.jsonl /app/turn-result.json 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-23T14:34:12.566Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276452566
        }
    ],
    "eventTimestamp": 1774276452506,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 35,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"rm -rf /app/agent/files/* 2>/dev/null; rm -rf /app/agent/.claude/skills/hook-methodology/hook-bank/*.md 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-23T14:34:12.600Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276452600
        }
    ],
    "eventTimestamp": 1774276452566,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 4674,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T1][session][restore.userId] from=storage userId=user_3ANzBpk1WdE1QZOshOLhHK8EAfI"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T2][ws][message] type=ping gen=false session=null"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T3][ws][message] type=generate gen=false session=null"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T4][handler][generate.enter] promptLen=32 sessionId=d8f9f65d-9485-4d9c-b2ae-0cfc9e18ad7f assets=0 source=none"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T5][session][persist] cid=campaign_mn3adoof1mzotg gen=true requestId=null"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T6][emit][ack] cid=campaign_mn3adoof1mzotg eventId=1 wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T7][emit][phase] cid=campaign_mn3adoof1mzotg eventId=2 wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[ASSET] No assetFileIds — generating without reference images"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T8][handler][generate.fireAndForget] cid=campaign_mn3adoof1mzotg sessionId=d8f9f65d-9485-4d9c-b2ae-0cfc9e18ad7f campaignId=campaign_mn3adoof1mzotg hasSourceResearch=false"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T9][gen][enter] cid=campaign_mn3adoof1mzotg sessionId=d8f9f65d-9485-4d9c-b2ae-0cfc9e18ad7f hasSdkSession=false promptLen=276"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T10][setup][enter] cid=campaign_mn3adoof1mzotg sessionId=d8f9f65d-9485-4d9c-b2ae-0cfc9e18ad7f hasSdkSession=false userId=user_3ANzBpk1WdE1QZOshOLhHK8EAfI"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[gen] Getting sandbox (attempt 1/3)"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T11][rpc][cleanupProcesses.start] cid=campaign_mn3adoof1mzotg"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T12][rpc][cleanupProcesses.done] cid=campaign_mn3adoof1mzotg ms=640"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T13][setup][killAgent] cid=campaign_mn3adoof1mzotg attempt=1"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T14][rpc][killAgent.start] cid=campaign_mn3adoof1mzotg"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T15][rpc][killAgent.done] cid=campaign_mn3adoof1mzotg ms=1473"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T16][setup][cleanMount] cid=campaign_mn3adoof1mzotg attempt=1"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T17][rpc][unmountBucket.start] cid=campaign_mn3adoof1mzotg"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T18][rpc][unmountBucket.error] cid=campaign_mn3adoof1mzotg ms=3 err=InvalidMountConfigError: No active mount found at path: /mnt/r2"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T19][rpc][cleanFuse.start] cid=campaign_mn3adoof1mzotg"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T20][rpc][cleanFuse.done] cid=campaign_mn3adoof1mzotg ms=448"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T21][setup][mountR2] cid=campaign_mn3adoof1mzotg attempt=1"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T22][rpc][mountBucket.start] cid=campaign_mn3adoof1mzotg"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T23][rpc][mountBucket.done] cid=campaign_mn3adoof1mzotg ms=288"
            ],
            "level": "log",
            "timestamp": 1774276447901
        },
        {
            "message": [
                "[T24][rpc][cleanAuthCache.start] cid=campaign_mn3adoof1mzotg"
            ],
            "level": "log",
            "timestamp": 1774276447901
        }
    ],
    "eventTimestamp": 1774276440991,
    "event": {
        "scheduledTime": "2026-03-23T14:34:07.900Z"
    }
}
{
    "wallTime": 13,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 462 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:34:17.923Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276457923
        }
    ],
    "eventTimestamp": 1774276457912,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10016,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276457923,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 462 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:34:27.969Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276467969
        }
    ],
    "eventTimestamp": 1774276467959,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 399,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276467983,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 7,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 462 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:34:38.002Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276478002
        }
    ],
    "eventTimestamp": 1774276477994,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10011,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276467969,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276478002,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 635 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:34:48.032Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276488032
        }
    ],
    "eventTimestamp": 1774276488022,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276488032,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 635 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:34:58.060Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276498060
        }
    ],
    "eventTimestamp": 1774276498052,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 5494,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276500991,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10011,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276498060,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 635 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:35:08.090Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276508090
        }
    ],
    "eventTimestamp": 1774276508082,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276508090,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 808 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:35:18.122Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276518122
        }
    ],
    "eventTimestamp": 1774276518114,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276518122,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 556,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276518133,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 808 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:35:28.150Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276528150
        }
    ],
    "eventTimestamp": 1774276528143,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276528150,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 9,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 808 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:35:38.181Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276538181
        }
    ],
    "eventTimestamp": 1774276538173,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10011,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276538181,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 11,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 981 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:35:48.220Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276548220
        }
    ],
    "eventTimestamp": 1774276548206,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10012,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276548220,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 8,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 981 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:35:58.252Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276558252
        }
    ],
    "eventTimestamp": 1774276558244,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 5661,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276548233,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276558252,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 981 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:36:08.285Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276568285
        }
    ],
    "eventTimestamp": 1774276568276,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 724,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276573004,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276568285,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 9,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 2410 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:36:18.317Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276578317
        }
    ],
    "eventTimestamp": 1774276578308,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 9,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 12946 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:36:28.345Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276588345
        }
    ],
    "eventTimestamp": 1774276588337,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276578317,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 19144 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:36:38.375Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276598375
        }
    ],
    "eventTimestamp": 1774276598366,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276588345,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 5807,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
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
            "timestamp": 1774276603070
        },
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=016d6cec"
            ],
            "level": "log",
            "timestamp": 1774276607192
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774276607192
        }
    ],
    "eventTimestamp": 1774276598388,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276598375,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 11,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 21459 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:36:48.410Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276608410
        }
    ],
    "eventTimestamp": 1774276608400,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10011,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276608410,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 12,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 21459 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:36:58.446Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276618446
        }
    ],
    "eventTimestamp": 1774276618435,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 180016,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
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
            "timestamp": 1774276440131
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Version retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"unknown\",\"timestamp\":\"2026-03-23T14:34:00.157Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440157
        },
        {
            "message": [
                "{\"level\":\"warn\",\"msg\":\"Container version check: Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.8\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"timestamp\":\"2026-03-23T14:34:00.157Z\"}"
            ],
            "level": "warn",
            "timestamp": 1774276440157
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Session created\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: sandbox-user-user_3anzbpk1wde1qzosholhhk8eafi-v2\",\"timestamp\":\"2026-03-23T14:34:00.165Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440165
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"pkill -f agent-runner 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-23T14:34:00.242Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276440242
        }
    ],
    "eventTimestamp": 1774276439149,
    "event": {
        "scheduledTime": "2026-03-23T14:33:59.782Z"
    }
}
{
    "wallTime": 1370,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276618446,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 857,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276620512,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 15,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 24946 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:37:08.484Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276628484
        }
    ],
    "eventTimestamp": 1774276628472,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276628484,
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
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 25151 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:37:18.524Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276638524
        }
    ],
    "eventTimestamp": 1774276638509,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276638524,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 37545 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:37:28.555Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276648555
        }
    ],
    "eventTimestamp": 1774276648547,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 5988,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276649481,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276648555,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 18,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 40306 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:37:38.590Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276658590
        }
    ],
    "eventTimestamp": 1774276658580,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276658590,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 11,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 40511 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:37:48.631Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276668631
        }
    ],
    "eventTimestamp": 1774276668622,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10009,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276668631,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 1073,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276676106,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 12,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 57915 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:37:58.666Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276678666
        }
    ],
    "eventTimestamp": 1774276678656,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276678666,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 14,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 79789 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:38:08.701Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276688701
        }
    ],
    "eventTimestamp": 1774276688691,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276688701,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 17,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 79994 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:38:18.740Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276698740
        }
    ],
    "eventTimestamp": 1774276698728,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10012,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276698740,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 6170,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276700059,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 18,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 93173 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:38:28.785Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276708785
        }
    ],
    "eventTimestamp": 1774276708771,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276708785,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 16,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 93173 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:38:38.825Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276718825
        }
    ],
    "eventTimestamp": 1774276718814,
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
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276718825,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 1280,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276723003,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 17,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 108956 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:38:48.872Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276728872
        }
    ],
    "eventTimestamp": 1774276728859,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10012,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276728872,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 18,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 125120 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:38:58.914Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276738914
        }
    ],
    "eventTimestamp": 1774276738904,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276738914,
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
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 125120 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:39:08.957Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276748957
        }
    ],
    "eventTimestamp": 1774276748945,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10012,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276748957,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 6410,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
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
            "timestamp": 1774276753015
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=d0a44169"
            ],
            "level": "log",
            "timestamp": 1774276755232
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=14779b7f"
            ],
            "level": "log",
            "timestamp": 1774276755232
        }
    ],
    "eventTimestamp": 1774276748976,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 20,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 143327 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:39:19.004Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276759004
        }
    ],
    "eventTimestamp": 1774276758989,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10008,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276759004,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 21,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 160631 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:39:29.048Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276769048
        }
    ],
    "eventTimestamp": 1774276769033,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 1504,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276771776,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10011,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276769048,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 21,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 168246 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:39:39.095Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276779095
        }
    ],
    "eventTimestamp": 1774276779080,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276779095,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 19,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 168452 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:39:49.139Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276789139
        }
    ],
    "eventTimestamp": 1774276789126,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10010,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276789139,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 18,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 168452 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:39:59.182Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276799182
        }
    ],
    "eventTimestamp": 1774276799167,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 671,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276799182,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 180035,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276619800,
    "event": {
        "scheduledTime": "2026-03-23T14:36:59.782Z"
    }
}
{
    "wallTime": 6636,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "256638505d33b1f881027f7bf4d29146a801d7ead470315bacf7b7f59ce98826",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[sdk-parser] msg.type=assistant uuid=b5b7e032"
            ],
            "level": "log",
            "timestamp": 1774276807559
        },
        {
            "message": [
                "[sdk-parser] assistant content: 1 blocks [tool_use]"
            ],
            "level": "log",
            "timestamp": 1774276807559
        },
        {
            "message": [
                "[sdk-parser] msg.type=trace uuid=none"
            ],
            "level": "log",
            "timestamp": 1774276807800
        },
        {
            "message": [
                "[sdk-parser] msg.type=user uuid=f014ad04"
            ],
            "level": "log",
            "timestamp": 1774276807800
        }
    ],
    "eventTimestamp": 1774276799200,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 42,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 198176 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:40:09.245Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276809245
        }
    ],
    "eventTimestamp": 1774276809212,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
{
    "wallTime": 10007,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774276809245,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 22,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=staging"
    ],
    "scriptVersion": {
        "id": "ba334b44-7a74-44d3-a3a3-443e7c2b0b40"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-staging",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Process logs retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"7a4db9e50974c65e36a48cb728eeb8a2c2bfaf3dc286042d22e09902f3604ada\",\"traceId\":\"tr_7876e4420db34d66\",\"details\":\"ID: proc_1774276452602_oyoamw, stdout: 232557 chars, stderr: 0 chars\",\"timestamp\":\"2026-03-23T14:40:19.286Z\"}"
            ],
            "level": "log",
            "timestamp": 1774276819286
        }
    ],
    "eventTimestamp": 1774276819273,
    "event": {
        "rpcMethod": "getProcessLogs"
    }
}
chakra@chakras-MacBook-Air creative_agent %