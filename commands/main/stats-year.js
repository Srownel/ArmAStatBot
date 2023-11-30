const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats-year')
		.setDescription('Get your stats for one specific year.')
		.setDescriptionLocalization('fr', 'Toutes les stats sur une année spécifique.')
		.addIntegerOption(option =>
			option.setName('year')
				.setNameLocalization('fr', 'année')
				.setDescription('Ex: 2022')
				.setMinValue(2021)
				.setMaxValue(new Date(Date.now()).getFullYear())
				.setRequired(true))
		.addStringOption(option =>
			option.setName('public')
			.setDescription('Make the results visible by everyone. For bragging purposes.')
			.setDescriptionLocalization('fr', "Afficher les résultats publiquement dans le channel. Pour se la péter.")
			.addChoices(
				{ 
					name: 'yes', 
					name_localizations: { fr: 'oui' },
					value: 'true',
				},
				{
					name: 'no (default)', 
					name_localizations: { fr: 'non (par défaut)' },
					value: 'false' 
				}
				)),
	async execute(interaction) {
		const year = interaction.options.getInteger('year');
		const public = ('true' === interaction.options.getString('public'));

		var playerSteamId;

		var jsonString = fs.readFileSync("./processFiles/claims.json", "utf8");

		try {
			var claims = JSON.parse(jsonString);
			playerSteamId = claims[interaction.user.id];
			if (playerSteamId === undefined) {
				return interaction.reply({ 
					content: interaction.locale == 'fr' ? 
						"Il semblerait que tu n'ai pas encore enregistré ton nom de jeu ou ton id steam. Commence par utiliser la commande /claim-name ou /claim-id." :
						"It would seem you have not yet claimed an in-game name or steam user id as your own. Start by using the /claim-name or /claim-id command.", 
					ephemeral: true 
				});
			}
		} catch (err) {
			console.log("File parse failed:", err);
			return interaction.reply({
				content: interaction.locale == 'fr' ? 
					"ERREUR : quelque chose a cassé en essayant de trouver ton nom de jeu. Ce n'est pas ta faute. Blâme <@169899983263236097>." :
					"ERROR : something went wrong trying to find your in-game name. This is not your fault. Blame <@169899983263236097>.", 
				ephemeral: true 
			});
		}

		try {
			const jsonString = fs.readFileSync("./processFiles/data.json", "utf8");

			try {
				const data = JSON.parse(jsonString);

				if (data['playerStats'][playerSteamId] === undefined) {
					return interaction.reply({ 
						content: interaction.locale == 'fr' ? 
							"Il semblerait qu'il n'y ai pas de données disponibles pour le nom ou l'id steam que tu as enregistré.\nSi tu penses que c'est une erreur, essaye de reset les choses avec /unclaim puis /claim-name ou /claim-id.\n\nPS: /claim-info peut te montrer les détails de ton enregistrement actuel." :
							"It would seem that we have no data available for the name or steam id you have claimed.\nIf you think this is not normal, try resetting things with the /unclaim and /claim-name or /claim-id command.\n\nPS: /claim-info can show you your current claim.", 
						ephemeral: true 
					});
				}

				var responseEN = "";
				var responseFR = "";

				const startOfYear_ts = Math.floor(new Date(year, 0, 1).getTime() / 1000);
				const endOfYear_ts = Math.floor(new Date(year+1, 0, 1).getTime() / 1000);

				const firstSessionOfYearIndex = data['sessionDates'].findIndex(function(number) { return number >= startOfYear_ts && number < endOfYear_ts; });
				if (firstSessionOfYearIndex == -1) {
					responseEN = "It doesn't seem like any session was played at all during the requested year. It's either that or our data is not up to date. Sorry.";
					responseFR = "Il semblerait qu'aucune session n'ait eu lieu sur l'année spécifiée. C'est soit ça, ou bien les données disponibles ne sont pas à jour. Désolé.";
					return interaction.reply({ 
						content: interaction.locale == 'fr' ? responseFR : responseEN, 
						ephemeral: true 
					});
				}

				var lastSessionOfYearIndex = data['sessionDates'].findIndex(function(number) { return number >= endOfYear_ts; }) - 1;
				if (lastSessionOfYearIndex == -2) {
					lastSessionOfYearIndex = data['sessionDates'].length - 1;
				}

				const startSessionIndex = data['playerStats'][playerSteamId]['sessions'].findIndex(function(number) { return number >= firstSessionOfYearIndex && number < lastSessionOfYearIndex; });
				if (startSessionIndex == -1) {
					responseEN = "It doesn't seem like you participated in any session during the requested year. It's either that or our data is not up to date. Sorry.";
					responseFR = "Il semblerait que tu n'ai participé à aucune session sur l'année spécifiée. C'est soit ça, ou bien les données disponibles ne sont pas à jour. Désolé.";
					return interaction.reply({ 
						content: interaction.locale == 'fr' ? responseFR : responseEN, 
						ephemeral: true 
					});
				}

				var endSessionIndex = data['playerStats'][playerSteamId]['sessions'].findIndex(function(number) { return number > lastSessionOfYearIndex; }) - 1;
				if (endSessionIndex == -2) {
					endSessionIndex = data['playerStats'][playerSteamId]['sessions'].length - 1;
				}

				responseEN = "Statistics found for the player '" + data['playerStats'][playerSteamId]['names'][0] + "' for the year " + year + ":\n\n";
				responseEN += ("Sessions played : " + (endSessionIndex - startSessionIndex + 1) + "\n\n");

				responseFR = "Données trouvées pour le joueur/la joueuse'" + data['playerStats'][playerSteamId]['names'][0] + "' pour l'année " + year + ":\n\n";
				responseFR += ("Nombre de sessions : " + (endSessionIndex - startSessionIndex + 1) + "\n\n");

				var infKills = data['playerStats'][playerSteamId]['infKills'][endSessionIndex];
				var lightKills = data['playerStats'][playerSteamId]['lightKills'][endSessionIndex];
				var armoredKills = data['playerStats'][playerSteamId]['armoredKills'][endSessionIndex];
				var airKills = data['playerStats'][playerSteamId]['airKills'][endSessionIndex];
				var playerKills = data['playerStats'][playerSteamId]['playerKills'][endSessionIndex];
				var deaths = data['playerStats'][playerSteamId]['deaths'][endSessionIndex];

				if (startSessionIndex > 0) {
					infKills -= data['playerStats'][playerSteamId]['infKills'][startSessionIndex - 1];
					lightKills -= data['playerStats'][playerSteamId]['lightKills'][startSessionIndex - 1];
					armoredKills -= data['playerStats'][playerSteamId]['armoredKills'][startSessionIndex - 1];
					airKills -= data['playerStats'][playerSteamId]['airKills'][startSessionIndex - 1];
					playerKills -= data['playerStats'][playerSteamId]['playerKills'][startSessionIndex - 1];
					deaths -= data['playerStats'][playerSteamId]['deaths'][startSessionIndex - 1];
				}

				responseEN += ("Total number of infantry kills : " + infKills + "\n");
				responseEN += ("Total number of light vehicle kills : " + lightKills + "\n");
				responseEN += ("Total number of armored vehicle kills : " + armoredKills + "\n");
				responseEN += ("Total number of air kills : " + airKills + "\n");
				responseEN += ("Total number of player kills : " + playerKills + "\n");
				responseEN += ("Total number of deaths : " + deaths + "\n");

				responseFR += ("Total de kills infanterie : " + infKills + "\n");
				responseFR += ("Total de kills de véhicules légers : " + lightKills + "\n");
				responseFR += ("Total de kills de véhicules blindés : " + armoredKills + "\n");
				responseFR += ("Total de kills de d'avions/hélicoptères/volants : " + airKills + "\n");
				responseFR += ("Total de kills joueurs : " + playerKills + "\n");
				responseFR += ("Total de morts : " + deaths + "\n");

				return interaction.reply({ 
					content: interaction.locale == 'fr' ? responseFR : responseEN, 
					ephemeral: !public 
				});
			} catch (err) {
				console.log("File parse failed:", err);
				return interaction.reply({ 
					content: interaction.locale == 'fr' ? 
						"ERREUR : quelque chose a cassé en essayant de lire les données. Ce n'est pas ta faute. Blâme <@169899983263236097>." :
						"ERROR : something went wrong parsing the data. This is not your fault. Blame <@169899983263236097>.", 
					ephemeral: true 
				});
			}

		} catch (err) {
			console.log(err);
			return interaction.reply({ 
				content:  interaction.locale == 'fr' ? 
					"ERREUR : quelque chose a cassé en essayant d'accéder aux données. Ce n'est pas ta faute. Blâme <@169899983263236097>." :
					'ERROR : something went wrong reading the data. This is not your fault. Blame <@169899983263236097>.',
				ephemeral: true 
			});
		}
	},
};