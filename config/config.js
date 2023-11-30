const { GatewayIntentBits, Partials } = require('discord.js');

// INTENTS AND PARTIALS

const botIntents = [
  GatewayIntentBits.DirectMessages,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.Guilds,
  GatewayIntentBits.MessageContent

];

const botPartials = [
  Partials.Channel, 
  Partials.Message
];

// COMMANDS

const prefix = '!';

const commands = {
  highfive: 'highfive'
};

// EXPORT ALL

module.exports = { botIntents, botPartials, prefix, commands };

