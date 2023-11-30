const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats-all')
		.setDescription('Get all your stats. Ever.')
		.setDescriptionLocalization('fr', "Toutes tes stats. Sur l'ensemble des parties suivies.")
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

				const lastSession_date = new Date(data['sessionDates'][data['sessionDates'].length - 1] * 1000);
				const lastSession_string = ("0" + lastSession_date.getDate()).slice(-2) + "-" + ("0" + (lastSession_date.getMonth() + 1)).slice(-2) + "-" + lastSession_date.getFullYear();
				const lastSession_string_en = lastSession_string + " (dd-mm-yyyy)";
				const lastSession_string_fr = lastSession_string + " (jj-mm-aaaa)";

				const lastDataUpdateMsg_en = "(Data updated for the last time on the " + lastSession_string_en + ".)\n\n";
				const lastDataUpdateMsg_fr = "(Données mises à jour pour la dernière fois le " + lastSession_string_fr + ".)\n\n";

				var responseEN = "Statistics found for the player '" + data['playerStats'][playerSteamId]['names'][0] + "' :\n" + lastDataUpdateMsg_en;
				var responseFR = "Données trouvées pour le joueur/la joueuse '" + data['playerStats'][playerSteamId]['names'][0] + "' :\n" + lastDataUpdateMsg_fr;

				const arrayLength = data['playerStats'][playerSteamId]['sessions'].length;
				responseEN += ("Sessions played : " + arrayLength + "\n\n");
				responseEN += ("Total number of infantry kills : " + data['playerStats'][playerSteamId]['infKills'][arrayLength - 1] + "\n");
				responseEN += ("Total number of light vehicle kills : " + data['playerStats'][playerSteamId]['lightKills'][arrayLength - 1] + "\n");
				responseEN += ("Total number of armored vehicle kills : " + data['playerStats'][playerSteamId]['armoredKills'][arrayLength - 1] + "\n");
				responseEN += ("Total number of air kills : " + data['playerStats'][playerSteamId]['airKills'][arrayLength - 1] + "\n");
				responseEN += ("Total number of player kills : " + data['playerStats'][playerSteamId]['playerKills'][arrayLength - 1] + "\n");
				responseEN += ("Total number of deaths : " + data['playerStats'][playerSteamId]['deaths'][arrayLength - 1] + "\n");

				responseFR += ("Nombre de sessions : " + arrayLength + "\n\n");
				responseFR += ("Total de kills infanterie : " + data['playerStats'][playerSteamId]['infKills'][arrayLength - 1] + "\n");
				responseFR += ("Total de kills de véhicules légers : " + data['playerStats'][playerSteamId]['lightKills'][arrayLength - 1] + "\n");
				responseFR += ("Total de kills de véhicules blindés : " + data['playerStats'][playerSteamId]['armoredKills'][arrayLength - 1] + "\n");
				responseFR += ("Total de kills de d'avions/hélicoptères/volants : " + data['playerStats'][playerSteamId]['airKills'][arrayLength - 1] + "\n");
				responseFR += ("Total de kills joueurs : " + data['playerStats'][playerSteamId]['playerKills'][arrayLength - 1] + "\n");
				responseFR += ("Total de morts : " + data['playerStats'][playerSteamId]['deaths'][arrayLength - 1] + "\n");

				return interaction.reply({ 
					content: interaction.locale == 'fr' ? responseFR : responseEN, 
					ephemeral: !public 
				});
			} catch (err) {
				console.log("File parse failed:", err);
				return interaction.reply({ 
					content:  interaction.locale == 'fr' ? 
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