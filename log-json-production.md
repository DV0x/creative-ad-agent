Last login: Mon Mar 23 20:03:03 on ttys000
chakra@chakras-MacBook-Air creative_agent % npx wrangler tail creative-agent-production --format json
{
    "wallTime": 1954,
    "cpuTime": 5,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[trace][worker][api] method=DELETE path=/api/campaigns/campaign_mn39x1k48356hj"
            ],
            "level": "log",
            "timestamp": 1774277294995
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774277295080
        },
        {
            "message": [
                "[trace][worker][api_done] method=DELETE path=/api/campaigns/campaign_mn39x1k48356hj status=200"
            ],
            "level": "log",
            "timestamp": 1774277296946
        }
    ],
    "eventTimestamp": 1774277294868,
    "event": {
        "request": {
            "url": "https://app.creativemachines.xyz/api/campaigns/campaign_mn39x1k48356hj",
            "method": "DELETE",
            "headers": {
                "accept": "*/*",
                "accept-encoding": "gzip, br",
                "accept-language": "en-US,en;q=0.9",
                "authorization": "REDACTED",
                "cf-connecting-ip": "175.101.96.182",
                "cf-ipcountry": "IN",
                "cf-ray": "9e0e3c641bd3c1d3",
                "cf-visitor": "{\"scheme\":\"https\"}",
                "content-type": "application/json",
                "cookie": "REDACTED",
                "host": "app.creativemachines.xyz",
                "origin": "https://app.creativemachines.xyz",
                "priority": "u=1, i",
                "referer": "https://app.creativemachines.xyz/",
                "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
                "sec-ch-ua-mobile": "?0",
                "sec-ch-ua-platform": "\"macOS\"",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "transfer-encoding": "chunked",
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
                "tlsClientRandom": "sLNXlVs1MYx7O9p5wo6tqEyMTZccDAyPZvGo6mOzd84=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "5GPc/YVwch4xHXo5JyVGfpyNju8=",
                "tlsClientExtensionsSha1Le": "MMnY5q4m8gvg5mzZVguPwkMBvCU=",
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
    "wallTime": 0,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "WS closed: session=null, code=1001, reason="
            ],
            "level": "log",
            "timestamp": 1774277297127
        }
    ],
    "eventTimestamp": 1774277287948,
    "event": {
        "getWebSocketEvent": {
            "wasClean": true,
            "code": 1001,
            "webSocketEventType": "close"
        }
    }
}
{
    "wallTime": 298,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
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
            "timestamp": 1774277298033
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774277298068
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/campaigns status=200"
            ],
            "level": "log",
            "timestamp": 1774277298328
        }
    ],
    "eventTimestamp": 1774277298033,
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
                "cf-ray": "9e0e3c77eda1c1d3",
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
                "tlsClientRandom": "sLNXlVs1MYx7O9p5wo6tqEyMTZccDAyPZvGo6mOzd84=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "5GPc/YVwch4xHXo5JyVGfpyNju8=",
                "tlsClientExtensionsSha1Le": "MMnY5q4m8gvg5mzZVguPwkMBvCU=",
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
    "wallTime": 356,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "ok",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
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
            "timestamp": 1774277298041
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774277298133
        },
        {
            "message": [
                "[trace][worker][api_done] method=GET path=/api/assets/folders status=200"
            ],
            "level": "log",
            "timestamp": 1774277298386
        }
    ],
    "eventTimestamp": 1774277298038,
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
                "cf-ray": "9e0e3c77eda3c1d3",
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
                "tlsClientRandom": "sLNXlVs1MYx7O9p5wo6tqEyMTZccDAyPZvGo6mOzd84=",
                "tlsClientCiphersSha1": "3HTt3+R/6BL3zeALJDSq0pR1yOQ=",
                "tlsClientExtensionsSha1": "5GPc/YVwch4xHXo5JyVGfpyNju8=",
                "tlsClientExtensionsSha1Le": "MMnY5q4m8gvg5mzZVguPwkMBvCU=",
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
    "wallTime": 28,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "responseStreamDisconnected",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277287920,
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
                "cf-ray": "9e0e3c372e6ec1d3",
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
                "x-user-id": "user_3BLeFZnSBcrY6MC9MQeg1xSwmOO"
            },
            "cf": {
                "clientTcpRtt": 67,
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
                "tlsClientRandom": "psNDtvSa93YLIuAvN+uwCLcGUEnxS7Z8ifq7U496pRI=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "272debd782d311896ce3aefaecfac22551611595d51f11925839866355a2246d",
                    "clientHandshake": "c4f149590c622142eac506d2fa2e888132fa6c064753fe3349e2fd50cecf3346",
                    "serverHandshake": "087354974908c7327fcd7e99d1b329935707c87b04a70f1f41c82fc3863d21ec",
                    "serverFinished": "27915575235fc268f784157bf7b84489a6a3bb29553f2e9332fe9d6b20fd392c"
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
                "tlsClientExtensionsSha1Le": "e8WVPIEVywQiogMn+ntNjC5b5dM=",
                "tlsClientExtensionsSha1": "wUFdVAbHL5z0gSHg2vBLtK91M6c=",
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
    "wallTime": 120,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "canceled",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
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
            "timestamp": 1774277287836
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774277287903
        },
        {
            "message": [
                "[trace][worker][ws_auth] userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO tokenPresent=true"
            ],
            "level": "log",
            "timestamp": 1774277287903
        },
        {
            "message": [
                "[trace][worker][ws_forward] userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO"
            ],
            "level": "log",
            "timestamp": 1774277287903
        }
    ],
    "eventTimestamp": 1774277287696,
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
                "cf-ray": "9e0e3c372e6ec1d3",
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
                "clientTcpRtt": 67,
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
                "tlsClientRandom": "psNDtvSa93YLIuAvN+uwCLcGUEnxS7Z8ifq7U496pRI=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "272debd782d311896ce3aefaecfac22551611595d51f11925839866355a2246d",
                    "clientHandshake": "c4f149590c622142eac506d2fa2e888132fa6c064753fe3349e2fd50cecf3346",
                    "serverHandshake": "087354974908c7327fcd7e99d1b329935707c87b04a70f1f41c82fc3863d21ec",
                    "serverFinished": "27915575235fc268f784157bf7b84489a6a3bb29553f2e9332fe9d6b20fd392c"
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
                "tlsClientExtensionsSha1Le": "e8WVPIEVywQiogMn+ntNjC5b5dM=",
                "tlsClientExtensionsSha1": "wUFdVAbHL5z0gSHg2vBLtK91M6c=",
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
    "wallTime": 430,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277320593,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 430,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277320593,
    "event": {
        "rpcMethod": "cleanupCompletedProcesses"
    }
}
{
    "wallTime": 430,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277320510,
    "event": {
        "rpcMethod": ""
    }
}
{
    "wallTime": 2656,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
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
            "timestamp": 1774277321367
        }
    ],
    "eventTimestamp": 1774277321019,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 2,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Unmounting bucket from /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"timestamp\":\"2026-03-23T14:48:43.700Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323700
        }
    ],
    "eventTimestamp": 1774277323679,
    "event": {
        "rpcMethod": "unmountBucket"
    }
}
{
    "wallTime": 93,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"pkill -9 s3fs 2>/dev/null; umount -l /mnt/r2 2>/dev/null; fusermount -u /mnt/r2 2>/dev/null; rm -rf /mnt/r2; mkdir -p /mnt/r2, Success: true\",\"timestamp\":\"2026-03-23T14:48:43.792Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323792
        }
    ],
    "eventTimestamp": 1774277323700,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 526,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Mounting bucket creative-agent-assets-prod to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"timestamp\":\"2026-03-23T14:48:43.794Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323794
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"File written\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"/tmp/.passwd-s3fs-60edce16-bdc6-4733-b45c-f6bb0c84b87b (124 chars)\",\"timestamp\":\"2026-03-23T14:48:43.837Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323837
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"chmod 0600 '/tmp/.passwd-s3fs-60edce16-bdc6-4733-b45c-f6bb0c84b87b', Success: true\",\"timestamp\":\"2026-03-23T14:48:43.902Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323902
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"mkdir -p '/mnt/r2', Success: true\",\"timestamp\":\"2026-03-23T14:48:43.964Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323964
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"s3fs 'creative-agent-assets-prod:/users/user_3BLeFZnSBcrY6MC9MQeg1xSwmOO' '/mnt/r2' -o 'passwd_file=/tmp/.passwd-s3fs-60edce16-bdc6-4733-b45c-f6bb0c84b87b,nomixupload,url=https://091650847ca6a1d9bb40bee044dfdc91.r2.cloudflarestorage.com', Success: true\",\"timestamp\":\"2026-03-23T14:48:44.318Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277324318
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Successfully mounted bucket creative-agent-assets-prod to /mnt/r2\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"timestamp\":\"2026-03-23T14:48:44.318Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277324318
        }
    ],
    "eventTimestamp": 1774277323792,
    "event": {
        "rpcMethod": "mountBucket"
    }
}
{
    "wallTime": 4865,
    "cpuTime": 6,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277308710,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 1051,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277323796,
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
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "WS closed: session=8ded89a7-a978-4cc4-8467-d9cf01344cf2, code=1006, reason=WebSocket disconnected without sending Close frame."
            ],
            "level": "log",
            "timestamp": 1774277324931
        }
    ],
    "eventTimestamp": 1774277324572,
    "event": {
        "getWebSocketEvent": {
            "wasClean": false,
            "code": 1006,
            "webSocketEventType": "close"
        }
    }
}
{
    "wallTime": 0,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "responseStreamDisconnected",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277298044,
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
                "cf-ray": "9e0e3c7938612ce8",
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
                "x-user-id": "user_3BLeFZnSBcrY6MC9MQeg1xSwmOO"
            },
            "cf": {
                "clientTcpRtt": 105,
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
                "tlsClientCiphersSha1": "tQJ4J5nKzcB8rojp6mWkZo8HEVU=",
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
                "tlsClientRandom": "ePQyaHnMfAvHg4aLsygQNZIXwinZHi88CrAmxpRHJ7I=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "f7185771d520c1068edab0273c2904f017766405f555246f353c96bd2c1ef738",
                    "clientHandshake": "7b7a77dfc4f89e2289a58c28e0317468873677b0d732ec2c3c00127e3aa41bcc",
                    "serverHandshake": "1dfb9e8e41e17fd8eecebe21fef2df901f86f20767cd927335d63055301acdda",
                    "serverFinished": "e2f82812df7fea604bc10a4cb7ec9fe7a8dfee116bdb448bd3ef34c91aa04b77"
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
                "tlsClientExtensionsSha1Le": "QbvmVlOtaa5/PJPVlL2HFjUDOP8=",
                "tlsClientExtensionsSha1": "q7djTzJLp1HdMYdgIHa4Xl/XV1k=",
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
    "wallTime": 110,
    "cpuTime": 2,
    "truncated": false,
    "executionModel": "stateless",
    "outcome": "responseStreamDisconnected",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
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
            "timestamp": 1774277298370
        },
        {
            "message": [
                "[AUTH] JWT verified OK: sub=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO, iss=https://clerk.creativemachines.xyz"
            ],
            "level": "log",
            "timestamp": 1774277298443
        },
        {
            "message": [
                "[trace][worker][ws_auth] userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO tokenPresent=true"
            ],
            "level": "log",
            "timestamp": 1774277298443
        },
        {
            "message": [
                "[trace][worker][ws_forward] userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO"
            ],
            "level": "log",
            "timestamp": 1774277298443
        }
    ],
    "eventTimestamp": 1774277298267,
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
                "cf-ray": "9e0e3c7938612ce8",
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
                "clientTcpRtt": 105,
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
                "tlsClientCiphersSha1": "tQJ4J5nKzcB8rojp6mWkZo8HEVU=",
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
                "tlsClientRandom": "ePQyaHnMfAvHg4aLsygQNZIXwinZHi88CrAmxpRHJ7I=",
                "tlsExportedAuthenticator": {
                    "clientFinished": "f7185771d520c1068edab0273c2904f017766405f555246f353c96bd2c1ef738",
                    "clientHandshake": "7b7a77dfc4f89e2289a58c28e0317468873677b0d732ec2c3c00127e3aa41bcc",
                    "serverHandshake": "1dfb9e8e41e17fd8eecebe21fef2df901f86f20767cd927335d63055301acdda",
                    "serverFinished": "e2f82812df7fea604bc10a4cb7ec9fe7a8dfee116bdb448bd3ef34c91aa04b77"
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
                "tlsClientExtensionsSha1Le": "QbvmVlOtaa5/PJPVlL2HFjUDOP8=",
                "tlsClientExtensionsSha1": "q7djTzJLp1HdMYdgIHa4Xl/XV1k=",
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
    "wallTime": 259,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277328502,
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
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277334053,
    "event": {
        "rpcMethod": "setSandboxName"
    }
}
{
    "wallTime": 3,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277339094,
    "event": {
        "rpcMethod": "setSleepAfter"
    }
}
{
    "wallTime": 14768,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "canceled",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"rm -f /mnt/r2/.claude/.credentials /mnt/r2/.claude/config.json /mnt/r2/.claude/auth.json 2>/dev/null; ls -la /mnt/r2/.claude/ 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-23T14:48:54.053Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277334053
        }
    ],
    "eventTimestamp": 1774277324318,
    "event": {
        "rpcMethod": "exec"
    }
}
{
    "wallTime": 10047,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277339094,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10056,
    "cpuTime": 1,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T1][do][fetch] userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO path=/ws upgrade=websocket"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T2][session][restore.found] session=8ded89a7-a978-4cc4-8467-d9cf01344cf2 campaign=campaign_mn3awlewlt4z6a gen=true userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T3][do][ws.accepted] cid=campaign_mn3awlewlt4z6a wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T4][ws][message] cid=campaign_mn3awlewlt4z6a type=subscribe gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T5][handler][subscribe.enter] cid=campaign_mn3awlewlt4z6a sessionId=8ded89a7-a978-4cc4-8467-d9cf01344cf2 lastEventId=0 hasEvents=false gen=true"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T6][handler][subscribe.doReset] cid=campaign_mn3awlewlt4z6a reason=empty_event_buffer"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T7][handler][subscribe.d1Check] cid=campaign_mn3awlewlt4z6a d1Status=generating campaignId=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T8][handler][subscribe.restartAlarm] cid=campaign_mn3awlewlt4z6a reason=DO_reset_while_generating"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T9][handler][subscribe.restoredFromStorage] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277339085
        },
        {
            "message": [
                "[T10][handler][subscribe.replay] cid=campaign_mn3awlewlt4z6a eventCount=0 lastEventId=0"
            ],
            "level": "log",
            "timestamp": 1774277339085
        }
    ],
    "eventTimestamp": 1774277329356,
    "event": {
        "scheduledTime": "2026-03-23T14:48:59.084Z"
    }
}
{
    "wallTime": 4712,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T11][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=1 gen=true cid=campaign_mn3awlewlt4z6a sandbox=false agent=null ageSec=20 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T12][alarm][sandbox.reconnect] cid=campaign_mn3awlewlt4z6a sandboxId=user-user_3blefznsbcry6mc9mqeg1xswmoo-v2"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T13][alarm][sandbox.reconnected] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T14][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=20 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T15][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T16][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=55 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T17][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277349141
        },
        {
            "message": [
                "[T18][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=1 ms=55"
            ],
            "level": "log",
            "timestamp": 1774277349141
        }
    ],
    "eventTimestamp": 1774277339140,
    "event": {
        "scheduledTime": "2026-03-23T14:49:09.140Z"
    }
}
{
    "wallTime": 5329,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277349388,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10041,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277339348,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10046,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277349384,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10046,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T19][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=2 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=30 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277359183
        },
        {
            "message": [
                "[T20][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=30 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277359183
        },
        {
            "message": [
                "[T21][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277359183
        },
        {
            "message": [
                "[T22][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=41 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277359183
        },
        {
            "message": [
                "[T23][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277359183
        },
        {
            "message": [
                "[T24][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=2 ms=41"
            ],
            "level": "log",
            "timestamp": 1774277359183
        },
        {
            "message": [
                "[T25][ws][message] cid=campaign_mn3awlewlt4z6a type=ping gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277359183
        }
    ],
    "eventTimestamp": 1774277354093,
    "event": {
        "scheduledTime": "2026-03-23T14:49:19.182Z"
    }
}
{
    "wallTime": 9624,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T26][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=3 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=40 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277369229
        },
        {
            "message": [
                "[T27][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=40 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277369229
        },
        {
            "message": [
                "[T28][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277369229
        },
        {
            "message": [
                "[T29][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=45 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277369229
        },
        {
            "message": [
                "[T30][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277369229
        },
        {
            "message": [
                "[T31][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=3 ms=45"
            ],
            "level": "log",
            "timestamp": 1774277369229
        }
    ],
    "eventTimestamp": 1774277359426,
    "event": {
        "scheduledTime": "2026-03-23T14:49:29.228Z"
    }
}
{
    "wallTime": 10050,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277359443,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 426,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277369482,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10043,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277369467,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10042,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T32][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=4 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=50 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277379279
        },
        {
            "message": [
                "[T33][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=50 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277379279
        },
        {
            "message": [
                "[T34][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277379279
        },
        {
            "message": [
                "[T35][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=50 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277379279
        },
        {
            "message": [
                "[T36][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277379279
        },
        {
            "message": [
                "[T37][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=4 ms=50"
            ],
            "level": "log",
            "timestamp": 1774277379279
        },
        {
            "message": [
                "[T38][ws][message] cid=campaign_mn3awlewlt4z6a type=ping gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277379279
        }
    ],
    "eventTimestamp": 1774277379112,
    "event": {
        "scheduledTime": "2026-03-23T14:49:39.279Z"
    }
}
{
    "wallTime": 10041,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277379516,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10041,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T39][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=5 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=60 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277389323
        },
        {
            "message": [
                "[T40][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=60 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277389323
        },
        {
            "message": [
                "[T41][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277389323
        },
        {
            "message": [
                "[T42][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=42 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277389323
        },
        {
            "message": [
                "[T43][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277389323
        },
        {
            "message": [
                "[T44][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=5 ms=42"
            ],
            "level": "log",
            "timestamp": 1774277389323
        }
    ],
    "eventTimestamp": 1774277379519,
    "event": {
        "scheduledTime": "2026-03-23T14:49:49.321Z"
    }
}
{
    "wallTime": 4599,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T45][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=6 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=70 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277399365
        },
        {
            "message": [
                "[T46][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=70 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277399365
        },
        {
            "message": [
                "[T47][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277399365
        },
        {
            "message": [
                "[T48][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=40 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277399365
        },
        {
            "message": [
                "[T49][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277399365
        },
        {
            "message": [
                "[T50][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=6 ms=40"
            ],
            "level": "log",
            "timestamp": 1774277399365
        }
    ],
    "eventTimestamp": 1774277399085,
    "event": {
        "scheduledTime": "2026-03-23T14:49:59.363Z"
    }
}
{
    "wallTime": 10047,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277389571,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 5448,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277399607,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10042,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277399603,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10042,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T51][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=7 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=80 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277409412
        },
        {
            "message": [
                "[T52][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=80 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277409412
        },
        {
            "message": [
                "[T53][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277409412
        },
        {
            "message": [
                "[T54][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=46 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277409412
        },
        {
            "message": [
                "[T55][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277409412
        },
        {
            "message": [
                "[T56][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=7 ms=46"
            ],
            "level": "log",
            "timestamp": 1774277409412
        },
        {
            "message": [
                "[T57][ws][message] cid=campaign_mn3awlewlt4z6a type=ping gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277409412
        }
    ],
    "eventTimestamp": 1774277409141,
    "event": {
        "scheduledTime": "2026-03-23T14:50:09.411Z"
    }
}
{
    "wallTime": 9394,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T58][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=8 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=90 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277419455
        },
        {
            "message": [
                "[T59][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=90 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277419455
        },
        {
            "message": [
                "[T60][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277419455
        },
        {
            "message": [
                "[T61][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=42 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277419455
        },
        {
            "message": [
                "[T62][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277419455
        },
        {
            "message": [
                "[T63][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=8 ms=42"
            ],
            "level": "log",
            "timestamp": 1774277419455
        }
    ],
    "eventTimestamp": 1774277419183,
    "event": {
        "scheduledTime": "2026-03-23T14:50:19.454Z"
    }
}
{
    "wallTime": 10046,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277409652,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 651,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277419699,
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
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277419697,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10036,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T64][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=9 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=100 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277429500
        },
        {
            "message": [
                "[T65][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=100 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277429500
        },
        {
            "message": [
                "[T66][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277429500
        },
        {
            "message": [
                "[T67][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=45 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277429500
        },
        {
            "message": [
                "[T68][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277429500
        },
        {
            "message": [
                "[T69][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=9 ms=45"
            ],
            "level": "log",
            "timestamp": 1774277429500
        },
        {
            "message": [
                "[T70][ws][message] cid=campaign_mn3awlewlt4z6a type=ping gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277429500
        }
    ],
    "eventTimestamp": 1774277429229,
    "event": {
        "scheduledTime": "2026-03-23T14:50:29.500Z"
    }
}
{
    "wallTime": 10049,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277429748,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10047,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T71][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=10 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=110 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277439537
        },
        {
            "message": [
                "[T72][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=110 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277439537
        },
        {
            "message": [
                "[T73][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277439537
        },
        {
            "message": [
                "[T74][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=36 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277439537
        },
        {
            "message": [
                "[T75][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277439537
        },
        {
            "message": [
                "[T76][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=10 ms=36"
            ],
            "level": "log",
            "timestamp": 1774277439537
        }
    ],
    "eventTimestamp": 1774277439279,
    "event": {
        "scheduledTime": "2026-03-23T14:50:39.536Z"
    }
}
{
    "wallTime": 4263,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T77][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=11 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=121 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277449585
        },
        {
            "message": [
                "[T78][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=121 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277449585
        },
        {
            "message": [
                "[T79][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277449585
        },
        {
            "message": [
                "[T80][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=47 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277449585
        },
        {
            "message": [
                "[T81][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277449585
        },
        {
            "message": [
                "[T82][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=11 ms=47"
            ],
            "level": "log",
            "timestamp": 1774277449585
        }
    ],
    "eventTimestamp": 1774277449323,
    "event": {
        "scheduledTime": "2026-03-23T14:50:49.584Z"
    }
}
{
    "wallTime": 5777,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277449836,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10040,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277439775,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10046,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277449831,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10046,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T83][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=12 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=131 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277459626
        },
        {
            "message": [
                "[T84][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=131 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277459626
        },
        {
            "message": [
                "[T85][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277459626
        },
        {
            "message": [
                "[T86][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=40 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277459626
        },
        {
            "message": [
                "[T87][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277459626
        },
        {
            "message": [
                "[T88][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=12 ms=40"
            ],
            "level": "log",
            "timestamp": 1774277459626
        },
        {
            "message": [
                "[T89][ws][message] cid=campaign_mn3awlewlt4z6a type=ping gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277459626
        }
    ],
    "eventTimestamp": 1774277459365,
    "event": {
        "scheduledTime": "2026-03-23T14:50:59.625Z"
    }
}
{
    "wallTime": 9195,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T90][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=13 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=141 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277469673
        },
        {
            "message": [
                "[T91][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=141 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277469673
        },
        {
            "message": [
                "[T92][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277469673
        },
        {
            "message": [
                "[T93][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=46 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277469673
        },
        {
            "message": [
                "[T94][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277469673
        },
        {
            "message": [
                "[T95][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=13 ms=46"
            ],
            "level": "log",
            "timestamp": 1774277469673
        }
    ],
    "eventTimestamp": 1774277469413,
    "event": {
        "scheduledTime": "2026-03-23T14:51:09.672Z"
    }
}
{
    "wallTime": 10041,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277459872,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 845,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277469910,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}
{
    "wallTime": 10051,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277469904,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10051,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T96][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=14 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=151 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277479714
        },
        {
            "message": [
                "[T97][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=151 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277479714
        },
        {
            "message": [
                "[T98][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277479714
        },
        {
            "message": [
                "[T99][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=40 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277479714
        },
        {
            "message": [
                "[T100][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277479714
        },
        {
            "message": [
                "[T101][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=14 ms=40"
            ],
            "level": "log",
            "timestamp": 1774277479714
        },
        {
            "message": [
                "[T102][ws][message] cid=campaign_mn3awlewlt4z6a type=ping gen=true session=8ded89a7-a978-4cc4-8467-d9cf01344cf2"
            ],
            "level": "log",
            "timestamp": 1774277479714
        }
    ],
    "eventTimestamp": 1774277479455,
    "event": {
        "scheduledTime": "2026-03-23T14:51:19.713Z"
    }
}
{
    "wallTime": 10035,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277479954,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 10035,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T103][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=15 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=161 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277489766
        },
        {
            "message": [
                "[T104][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=161 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277489766
        },
        {
            "message": [
                "[T105][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277489766
        },
        {
            "message": [
                "[T106][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=51 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277489766
        },
        {
            "message": [
                "[T107][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277489766
        },
        {
            "message": [
                "[T108][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=15 ms=51"
            ],
            "level": "log",
            "timestamp": 1774277489766
        }
    ],
    "eventTimestamp": 1774277489500,
    "event": {
        "scheduledTime": "2026-03-23T14:51:29.765Z"
    }
}
{
    "wallTime": 180016,
    "cpuTime": 3,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
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
            "timestamp": 1774277322403
        },
        {
            "message": [
                "Port 3000 is ready"
            ],
            "level": "log",
            "timestamp": 1774277323471
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Version retrieved\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"unknown\",\"timestamp\":\"2026-03-23T14:48:43.529Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323529
        },
        {
            "message": [
                "{\"level\":\"warn\",\"msg\":\"Container version check: Container version could not be determined. This may indicate an outdated container image. Please update your container to match SDK version 0.7.8\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"timestamp\":\"2026-03-23T14:48:43.529Z\"}"
            ],
            "level": "warn",
            "timestamp": 1774277323529
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Session created\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"ID: sandbox-user-user_3blefznsbcry6mc9mqeg1xswmoo-v2\",\"timestamp\":\"2026-03-23T14:48:43.537Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323537
        },
        {
            "message": [
                "{\"level\":\"info\",\"msg\":\"Command executed\",\"component\":\"sandbox-do\",\"sandboxId\":\"c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985\",\"traceId\":\"tr_5477a260556a4a64\",\"details\":\"pkill -f agent-runner 2>/dev/null || true, Success: true\",\"timestamp\":\"2026-03-23T14:48:43.677Z\"}"
            ],
            "level": "log",
            "timestamp": 1774277323677
        }
    ],
    "eventTimestamp": 1774277321367,
    "event": {
        "scheduledTime": "2026-03-23T14:48:42.022Z"
    }
}
{
    "wallTime": 2256,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "c8322cfece7a418d2ce49d3102afe1484375d0ed8041088c818dd6a82cd74985",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "Sandbox",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277490002,
    "event": {
        "rpcMethod": "readFile"
    }
}
{
    "wallTime": 4068,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [
        {
            "message": [
                "[T109][alarm][enter] cid=campaign_mn3awlewlt4z6a iter=16 gen=true cid=campaign_mn3awlewlt4z6a sandbox=true agent=null ageSec=171 userId=user_3BLeFZnSBcrY6MC9MQeg1xSwmOO wsCount=1"
            ],
            "level": "log",
            "timestamp": 1774277499802
        },
        {
            "message": [
                "[T110][alarm][zombie.waiting] cid=campaign_mn3awlewlt4z6a ageSec=171 threshold=300"
            ],
            "level": "log",
            "timestamp": 1774277499802
        },
        {
            "message": [
                "[T111][rpc][readTurnResult.start] cid=campaign_mn3awlewlt4z6a"
            ],
            "level": "log",
            "timestamp": 1774277499802
        },
        {
            "message": [
                "[T112][rpc][readTurnResult.error] cid=campaign_mn3awlewlt4z6a ms=35 err=FileNotFoundError: File not found: /app/turn-result.json"
            ],
            "level": "log",
            "timestamp": 1774277499802
        },
        {
            "message": [
                "[T113][alarm][reschedule] cid=campaign_mn3awlewlt4z6a nextIn=10000"
            ],
            "level": "log",
            "timestamp": 1774277499802
        },
        {
            "message": [
                "[T114][alarm][exit.ok] cid=campaign_mn3awlewlt4z6a iter=16 ms=35"
            ],
            "level": "log",
            "timestamp": 1774277499802
        }
    ],
    "eventTimestamp": 1774277499537,
    "event": {
        "scheduledTime": "2026-03-23T14:51:39.801Z"
    }
}
{
    "wallTime": 5968,
    "cpuTime": 0,
    "truncated": false,
    "executionModel": "durableObject",
    "outcome": "ok",
    "durableObjectId": "dffedd740e55acdb4d6486a14f8fb886b0504dbc521c429ed6a65d7525a142af",
    "scriptTags": [
        "cf:service=creative-agent",
        "cf:environment=production"
    ],
    "scriptVersion": {
        "id": "5af6e7ef-947d-463d-b41c-a1bf29900248"
    },
    "entrypoint": "CampaignSession",
    "scriptName": "creative-agent-production",
    "diagnosticsChannelEvents": [],
    "exceptions": [],
    "logs": [],
    "eventTimestamp": 1774277500045,
    "event": {
        "getWebSocketEvent": {
            "webSocketEventType": "message"
        }
    }
}