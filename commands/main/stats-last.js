const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stats-last')
		.setDescription('Get your stats for the last X sessions/weeks/months/years.')
		.setDescriptionLocalization('fr', "Toutes tes stats sur les X dernièr(e)s sessions/semaines/mois/années.")
		.addIntegerOption(option =>
			option.setName('number')
				.setNameLocalization('fr', 'nombre')
				.setDescription('How many?')
				.setDescriptionLocalization('fr', 'Combien?')
				.setMinValue(1)
				.setMaxValue(100)
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('unit')
				.setNameLocalization('fr', 'unité')
				.setDescription('What?')
				.setDescriptionLocalization('fr', 'De quoi?')
				.addChoices(
					{ name: 'sessions', name_localizations: { fr: 'sessions' }, value: 0 },
					{ name: 'weeks', name_localizations: { fr: 'semaines' }, value: 1 },
					{ name: 'months', name_localizations: { fr: 'mois' }, value: 2 },
					{ name: 'years', name_localizations: { fr: 'années' }, value: 3 }
				)
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
		const number = interaction.options.getInteger('number');
		const unit = interaction.options.getInteger('unit');
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

				var responseEN = "Statistics found for the player '" + data['playerStats'][playerSteamId]['names'][0] + "' over the last ";
				var responseFR = "Données trouvées pour le joueur/la joueuse '" + data['playerStats'][playerSteamId]['names'][0] + "' sur les ";

				const arrayLength = data['playerStats'][playerSteamId]['sessions'].length;
				var firstSessionIndexAbs = 0;
				var firstSessionIndex;

				var now_date = new Date(Date.now()); 
				var target_date;
				var target_ts;

				switch (unit) {
					case 0:
						firstSessionIndex = arrayLength - number;

						if (firstSessionIndex < 0) {
							responseEN += arrayLength + " session(s) (you asked for " + number + ", but you haven't even played that many times yet):\n\n";
							responseFR += arrayLength + " dernières sessions (" + number + "demandées, mais tu n'as pas encore joué tant de parties):\n\n";
						} else {
							responseEN += number + " session(s):\n" + lastDataUpdateMsg_en;
							responseFR += number + " dernières sessions:\n" + lastDataUpdateMsg_fr;
						}

						break;

					case 1:
						responseEN += number + " week(s):\n" + lastDataUpdateMsg_en;
						responseFR += number + " dernières semaines:\n" + lastDataUpdateMsg_fr;

						target_date = new Date(now_date.getFullYear(), now_date.getMonth(), now_date.getDate() - 7*number);
						target_ts = Math.floor(target_date.getTime() / 1000);

						firstSessionIndexAbs = data['sessionDates'].findIndex(function(number) {
							return number > target_ts;
						});

						if (firstSessionIndexAbs == -1) {
							break;
						}

						firstSessionIndex = data['playerStats'][playerSteamId]['sessions'].findIndex(function(number) {
							return number >= firstSessionIndexAbs;
						});

						responseEN += ("Sessions played : " + (arrayLength - firstSessionIndex) + "\n\n");
						responseFR += ("Nombre de sessions : " + (arrayLength - firstSessionIndex) + "\n\n");

						break;

					case 2:
						responseEN += number + " month(s):\n" + lastDataUpdateMsg_en;
						responseFR += number + " derniers mois:\n" + lastDataUpdateMsg_fr;

						target_date = new Date(now_date.getFullYear(), now_date.getMonth() - number, now_date.getDate());
						target_ts = Math.floor(target_date.getTime() / 1000);

						firstSessionIndexAbs = data['sessionDates'].findIndex(function(number) {
							return number > target_ts;
						});

						if (firstSessionIndexAbs == -1) {
							break;
						}

						firstSessionIndex = data['playerStats'][playerSteamId]['sessions'].findIndex(function(number) {
							return number >= firstSessionIndexAbs;
						});

						responseEN += ("Sessions played : " + (arrayLength - firstSessionIndex) + "\n\n");
						responseFR += ("Nombre de sessions : " + (arrayLength - firstSessionIndex) + "\n\n");

						break;

					case 3:
						responseEN += number + " year(s):\n" + lastDataUpdateMsg_en;
						responseFR += number + " dernières années:\n" + lastDataUpdateMsg_fr;

						if (now_date.getFullYear() - number < 1970) {
							firstSessionIndex = 0;
						} else {
							target_date = new Date(now_date.getFullYear() - number, now_date.getMonth(), now_date.getDate());
							target_ts = Math.floor(target_date.getTime() / 1000);

							firstSessionIndexAbs = data['sessionDates'].findIndex(function(number) {
								return number > target_ts;
							});
	
							if (firstSessionIndexAbs == -1) {
								break;
							}
	
							firstSessionIndex = data['playerStats'][playerSteamId]['sessions'].findIndex(function(number) {
								return number >= firstSessionIndexAbs;
							});
						}

						responseEN += ("Sessions played : " + (arrayLength - firstSessionIndex) + "\n\n");
						responseFR += ("Nombre de sessions : " + (arrayLength - firstSessionIndex) + "\n\n");

						break;
				}

				if (firstSessionIndexAbs == -1) {
					responseEN = "It doesn't seem like any session was played at all within the requested period. The last session we have knowledge of was played " + lastSession_string_en + ".\n\n";
					responseEN += "Either no session has been played since, or our data is not up to date. Sorry.";

					responseFR = "Il semblerait qu'aucune session n'ait eu lieu sur la période spécifiée. La dernière session disponible dans les données date du " + lastSession_string_fr + ".\n\n";
					responseFR += "Soit aucune session n'a été jouée depuis, ou bien les données disponibles ne sont pas à jour. Désolé.";

					return interaction.reply({ 
						content: interaction.locale == 'fr' ? responseFR : responseEN, 
						ephemeral: true 
					});
				}

				if (firstSessionIndex == -1) {
					const lastPlayerSessionIndex = data['playerStats'][playerSteamId]['sessions'][data['playerStats'][playerSteamId]['sessions'].length - 1];
					const lastPlayerSession_date = new Date(data['sessionDates'][lastPlayerSessionIndex] * 1000);
					const lastPlayerSession_string = ("0" +lastPlayerSession_date.getDate()).slice(-2) + "-" + ("0" + (lastPlayerSession_date.getMonth() + 1)).slice(-2) + "-" + lastPlayerSession_date.getFullYear();
					const lastPlayerSession_string_en = lastPlayerSession_string + " (dd-mm-yyyy)";
					const lastPlayerSession_string_fr = lastPlayerSession_string + " (jj-mm-aaaa)";

					responseEN = "It doesn't seem like you have participated in a session within the requested period. Your last session we have knowledge of was " + lastPlayerSession_string_en + ".\n\n";
					responseEN += "Either you haven't played since, or our data is not up to date. Sorry.";

					responseFR = "Il semblerait que tu n'ai participé à aucune session sur la période spécifiée. Ta dernière session disponible dans les données date du " + lastPlayerSession_string_fr + ".\n\n";
					responseFR += "Soit tu n'as pas joué depuis, soit les données disponibles ne sont pas à jour. Désolé.";

					return interaction.reply({ 
						content: interaction.locale == 'fr' ? responseFR : responseEN, 
						ephemeral: true 
					});
				}

				var infKills = data['playerStats'][playerSteamId]['infKills'][arrayLength - 1];
				var lightKills = data['playerStats'][playerSteamId]['lightKills'][arrayLength - 1];
				var armoredKills = data['playerStats'][playerSteamId]['armoredKills'][arrayLength - 1];
				var airKills = data['playerStats'][playerSteamId]['airKills'][arrayLength - 1];
				var playerKills = data['playerStats'][playerSteamId]['playerKills'][arrayLength - 1];
				var deaths = data['playerStats'][playerSteamId]['deaths'][arrayLength - 1];

				if (firstSessionIndex > 0) {
					infKills -= data['playerStats'][playerSteamId]['infKills'][firstSessionIndex - 1];
					lightKills -= data['playerStats'][playerSteamId]['lightKills'][firstSessionIndex - 1];
					armoredKills -= data['playerStats'][playerSteamId]['armoredKills'][firstSessionIndex - 1];
					airKills -= data['playerStats'][playerSteamId]['airKills'][firstSessionIndex - 1];
					playerKills -= data['playerStats'][playerSteamId]['playerKills'][firstSessionIndex - 1];
					deaths -= data['playerStats'][playerSteamId]['deaths'][firstSessionIndex - 1];
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