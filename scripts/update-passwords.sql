-- Mise à jour des mots de passe et PINs
-- Généré automatiquement le 27/01/2026 09:10:53

-- admin@orema.ga
UPDATE utilisateurs SET
  password = '5d346199ecd75777551941917049a87d:b08d2e8192799deba01e37cd578644651bd3bb1e49f7238792318e8ca1d91921ce405aeb88523b51cb59cb8336ac95ba67d3eef55d5deccb1aea89007e7e439c',
  "pinCode" = '5456fa9b2f6a001de4237c57700fe2c0:a0a58b628c8ca9bca8130b7ecb9e3eed03ab6f70bbb9ed424d05e460b11277db5be540d84245abd27217a7d84a7bfaa520aaf56291e3d6844286a708cdfd697c',
  "updatedAt" = NOW()
WHERE email = 'admin@orema.ga';

-- manager@orema.ga
UPDATE utilisateurs SET
  password = 'aec5c161d7caed1bf5fb503a184a625d:973fa4ba5d071c2e0ef07c8feabc1eefd9b9a0d71d761b6f440e87fc8e5bac3a62dc7e8adbf8426af5a82951e99b60d9dde9e0da65c65675355011052090f37e',
  "pinCode" = '6d643b186731a7de5f9bb7ac6b84fc16:d40e341c908b343d244d097bbf9f37190551f47f9fc2eed1ead8051da902b7a9868bfdd58ac6bc9162655582489d3a9b5d10d892629639dd8e8f5b2b497494d3',
  "updatedAt" = NOW()
WHERE email = 'manager@orema.ga';

-- caisse@orema.ga
UPDATE utilisateurs SET
  password = NULL,
  "pinCode" = 'd5ce7370ff2db10b31941547f6fcb818:b14cf68f8dfd7a2781cc713e5047ba2550ffab512191f179de63b8ccfd7d553a96dcf95d948feac878faeb3199502b2845428bdb8a9250bcbe87c3481a6f6861',
  "updatedAt" = NOW()
WHERE email = 'caisse@orema.ga';

-- serveur@orema.ga
UPDATE utilisateurs SET
  password = NULL,
  "pinCode" = '0368604366baaacc388e63d9f4fa7757:d5480175f576cd5dbffe5b071ce465bf89487fd9c392fb83fbd45445be52823a8a12e66b02e0e4c2a067f2d6bc5521dd4dee5a8acc9e042897452c67f0f70583',
  "updatedAt" = NOW()
WHERE email = 'serveur@orema.ga';

