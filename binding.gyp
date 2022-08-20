{
  "variables": {
    "module_path": "./build",
    "openssl_fips": "",
  },
  'target_defaults': {
    'defines': [
      'CBC=1',
      'AES256=1'
    ]
  },
  'targets': [
    {
      'target_name': 'main',
      'sources': [
        'src/encryption/main.cpp',
        'src/encryption/encoding/base64.c',
        'src/encryption/aes/aes.c'
      ],
      'includes': [
        './common.gypi'
      ]
    },
    {
      'target_name': 'renderer',
      'sources': [
        'src/encryption/main.cpp',
        'src/encryption/encoding/base64.c',
        'src/encryption/aes/aes.c'
      ],
      'includes': [
        './common.gypi'
      ],
      'defines':[
        '_TARGET_ELECTRON_RENDERER_'
      ]
    },
     {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "main", "renderer" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/main.node", "<(PRODUCT_DIR)/renderer.node" ],
          "destination": "<(module_path)"
        }
      ]
    }
  ]
}
