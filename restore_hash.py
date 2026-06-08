import json, base64
orig = b'$2b$12$KWyqz74Nox1diri5uGmGM.9252aYGHTkkU4aiva7Rs6eJkBmZu6/u'
b64 = base64.b64encode(orig).decode()
path = '/config/.storage/auth_provider.homeassistant'
d = json.load(open(path))
d['data']['users'][0]['password'] = b64
with open(path,'w') as f: json.dump(d,f)
print('Restored. b64:', b64[:30], '...')
