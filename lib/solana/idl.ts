/**
 * IDL definition for the HAUS program
 * This should match the actual on-chain program structure
 */

export const HAUS_IDL = {
  "version": "0.1.0",
  "name": "haus",
  "instructions": [
    {
      "name": "createEvent",
      "accounts": [
        {
          "name": "realtimeAsset",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "event",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mplCoreProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "CreateEventParams"
          }
        }
      ]
    },
    {
      "name": "initTippingCalculator",
      "accounts": [
        {
          "name": "realtimeAsset",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "event",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tippingCalculator",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "makeTip",
      "accounts": [
        {
          "name": "event",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tippingCalculator",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "signer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "params",
          "type": {
            "defined": "TipParams"
          }
        }
      ]
    },
    {
      "name": "claimRealtimeAsset",
      "accounts": [
        {
          "name": "event",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "realtimeAsset",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mplCoreProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "withdrawTips",
      "accounts": [
        {
          "name": "realtimeAsset",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "event",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "authority",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "Event",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "publicKey"
          },
          {
            "name": "realtimeAsset",
            "type": "publicKey"
          },
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "beginTimestamp",
            "type": "i64"
          },
          {
            "name": "endTimestamp",
            "type": "i64"
          },
          {
            "name": "reservePrice",
            "type": "u64"
          },
          {
            "name": "ticketCollection",
            "type": "publicKey"
          },
          {
            "name": "artCategory",
            "type": "string"
          },
          {
            "name": "claimed",
            "type": "bool"
          },
          {
            "name": "totalTips",
            "type": "u64"
          },
          {
            "name": "tipsClaimed",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TippingCalculator",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tipper",
            "type": "publicKey"
          },
          {
            "name": "realtimeAsset",
            "type": "publicKey"
          },
          {
            "name": "totalAmount",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CreateEventParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "name",
            "type": "string"
          },
          {
            "name": "uri",
            "type": "string"
          },
          {
            "name": "begin_timestamp",
            "type": "i64"
          },
          {
            "name": "end_timestamp",
            "type": "i64"
          },
          {
            "name": "reserve_price",
            "type": "u64"
          },
          {
            "name": "ticket_collection",
            "type": "publicKey"
          },
          {
            "name": "art_category",
            "type": "string"
          }
        ]
      }
    },
    {
      "name": "TipParams",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "realtime_asset_key",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidAuthority",
      "msg": "Invalid authority"
    },
    {
      "code": 6001,
      "name": "EventNotOver",
      "msg": "Event has not ended yet"
    },
    {
      "code": 6002,
      "name": "EventAlreadyClaimed",
      "msg": "Event already claimed"
    },
    {
      "code": 6003,
      "name": "TipsAlreadyClaimed",
      "msg": "Tips already claimed"
    }
  ]
};