const path = require('path')
const isAdmin = require('is-admin')
const Registry = require('winreg')

function getKey(key) {
	let [hive, ...keys] = key.split('\\')
	return new Registry({
		hive: Registry[hive],
		key: '\\' + keys.join('\\')
	})
}

function deleteKey(key) {
	return new Promise((resolve, reject) => {
		let regKey = getKey(key)
		regKey.keyExists((err, exists) => {
			if (err) {
				console.log('Failed to check registry key existence:', key, err)
				return reject(err)
			}

			if (!exists) return resolve()

			regKey.destroy(err => {
				if (err) {
					console.log('Failed to delete registry key:', key, err)
					reject(err)
				} else {
					console.log('Registry key deleted:', key)
					resolve()
				}
			})
		})
	})
}

function setValue(regKey, name, type, value) {
	return new Promise((resolve, reject) => {
		let cb = err => {
			if (err) reject(err)
			else resolve()
		}

		if (name === '') {
			regKey.set(Registry.DEFAULT_VALUE, type, value, cb)
		} else {
			regKey.set(name, type, value, cb)
		}
	})
}

async function setValueInBatch(opt) {
	for (let [key, values] of Object.entries(opt)) {
		let regKey = getKey(key)
		for (let [name, { type, value }] of Object.entries(values)) {
			await setValue(regKey, name, type, value)
		}
	}
}

const CONTEXT_MENU_KEY = {
	drive: 'HKCR\\Drive',
	driveBackground: 'HKCR\\Drive\\Background',
	directory: 'HKCR\\Directory',
	directoryBackground: 'HKCR\\Directory\\Background'
}

async function registerContextMenu({ name, title, icon, command, location }) {
	let values = Object.entries(location)
		.filter(([loc, yes]) => yes)
		.map(([loc, yes]) => CONTEXT_MENU_KEY[loc])
		.reduce(
			(acc, loc) =>
				Object.assign(acc, {
					[`${loc}\\shell\\${name}`]: {
						'': {
							type: 'REG_SZ',
							value: title
						},
						Icon: {
							type: 'REG_SZ',
							value: icon
						}
					},
					[`${loc}\\shell\\${name}\\command`]: {
						'': {
							type: 'REG_SZ',
							value: command
						}
					}
				}),
			{}
		)
	await setValueInBatch(values)
}

async function unregisterContextMenu({ name, location }) {
	for (let [loc, yes] of Object.entries(location)) {
		if (yes) {
			await deleteKey(`${CONTEXT_MENU_KEY[loc]}\\shell\\${name}`)
		}
	}
}

module.exports.register = async function() {
	if (process.platform !== 'win32') {
		console.log('This feature only support Windows.')
		return
	}

	if ((await isAdmin()) === false) {
		console.log('Please run in elevated command prompt')
		return
	}

	await registerContextMenu({
		name: 'cactus',
		title: 'cactus here',
		icon: path.resolve(__dirname, '../res/cactus.ico'),
		command: 'cmd /K "cactus -d "%V""',
		location: {
			drive: true,
			driveBackground: true,
			directory: true,
			directoryBackground: true
		}
	})

	console.log('Context menu entries created.')
}

module.exports.unregister = async function() {
	if (process.platform !== 'win32') {
		console.log('This feature only support Windows.')
		return
	}

	if ((await isAdmin()) === false) {
		console.log('Please run in elevated command prompt')
		return
	}

	await unregisterContextMenu({
		name: 'cactus',
		location: {
			drive: true,
			driveBackground: true,
			directory: true,
			directoryBackground: true
		}
	})

	console.log('Context menu entries removed.')
}
