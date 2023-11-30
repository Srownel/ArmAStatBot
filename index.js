const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, Events } = require('discord.js');
const { botIntents, botPartials, prefix, commands } = require('./config/config');
const config = require('./config/default');

const client = new Client({
  intents: botIntents,
  partials: botPartials,
});

// CREATE A COLLECTION OF ALL SLASH COMMANDS FROM THE COMMANDS FOLDER

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// ON STARTUP

client.once(Events.ClientReady, () => {
	console.log('Logged in as ' + client.user.tag);
});

// PREFIX COMMANDS

client.on('messageCreate', async (msg) => {

  if (msg.author.bot) {
    return;
  }
  if (!msg.content.startsWith(prefix)) {
    return; // do nothing if command is not preceded with prefix
  }

  const userCmd = msg.content.slice(prefix.length);

  if (userCmd === commands.highfive) {
    if (msg.author.username === "srownel") { // hard code some user specific commands while basing yourself off of username LMAO
      msg.channel.send(":raised_hands:");
    }
  } 
  // else {
  //   msg.reply('I do not understand your command');
  // }
});

// SLASH COMMANDS

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command! (000)', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command! (001)', ephemeral: true });
		}
	}
});

client.login(config.DISCORD_TOKEN);