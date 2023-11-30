const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim-id')
		.setDescription("Claim a Steam ID as yours. This action is public. Identity theft is not a joke Jim.")
		.setDescriptionLocalization('fr', 'Revendiquer un ID Steam comme le vôtre. Cette action est exclusive et publique.')
		.addStringOption(option => option.setName('steamid')
			.setDescription('Your unique Steam ID.')
			.setDescriptionLocalization('fr', 'Votre ID Steam unique.')
			.setRequired(true)),
	async execute(interaction) {
		const steamId = interaction.options.getString('steamid');

		// READ AND UPDATE JSON
		var jsonString = fs.readFileSync("./processFiles/claims.json", "utf8");

		try {
			var claims = JSON.parse(jsonString);

			if (claims[interaction.user.id] === undefined) {
				var responseEN;
				var responseFR;

				var jsonDataString = fs.readFileSync("./processFiles/data.json", "utf8");
				var stats = JSON.parse(jsonDataString);

				/* Check if this id is a valid claim */
				
				if (stats['playerStats'][steamId] === undefined) {
					responseEN = "It doesn't seem like we have any data linked to the id you entered. Are you sure it is a valid Steam ID? "
						+ "You can find your Steam ID from the 'Account Details' page of the Steam webpage or client when logged-in. "
						+ "Your steam account obviously needs to be the one you used to connect and play on our ArmA3 server.\n"
						+ "Alternativaly, you can use the /claim-name command to register your claim using your in-game name instead.\n\n"
						+ "If you have double-checked everything and believe there is an error, contact <@169899983263236097>.";
					responseFR = "Il semblerait qu'il n'y ai aucune donnée disponible pour l'ID Steam renseigné. Es-tu sûr qu'il s'agit d'un ID Steam valide? "
						+ "Tu peux trouver ton ID Steam depuis la page 'Détails du compte' sur le site ou le client Steam après t'être connecté. "
						+ "Le compte Steam doit évidemment être celui utilisé pour se connecter et jouer sur le serveur ArmA3.\n"
						+ "Alternativement, tu peux toujours utiliser la commande /claim-name pour t'identifier plutôt par ton nom utilisé en jeu.\n\n"
						+ "Si tu as tout vérifié et pense être victime d'une erreur du système, contacte <@169899983263236097>.";
					return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
				}

				/* Check if this id is not already claimed */

				for (const discordId in claims) {
					if (claims[discordId] == steamId) {
						responseEN = `It appears that this Steam ID has already been claimed by <@${discordId}> :s\n\n`
							+ "Are you sure that this is correct ID of the Steam account you have been using to play ArmA on this server?\n"
							+ "This Steam ID has been known to play under the following names: ";
						responseFR = `Il semblerait que cet ID Steam ai déjà été revendiqué par <@${discordId}> :s\n\n`
							+ "Es-tu sûr d'avoir correctement renseigné l'ID Steam du compte utilisé pour jouer à ArmA sur ce serveur?\n"
							+ "Cet ID Steam a déjà joué sous les noms suivants: ";

						const names = stats['playerStats'][steamId]['names'];

						for (let i = 0; i < names.length - 1; i++) {
							responseEN += names[i] + ", ";
							responseFR += names[i] + ", ";
						}
						responseEN += names[names.length - 1] + ".\n\n";
						responseFR += names[names.length - 1] + ".\n\n";

						responseEN += "If you believe that your account was illegitimately claimed, please contact the administrator to sort things out.";
						responseFR += "Si tu penses que ton nom a été revendiqué par quelqu'un d'illégitime, merci de contacter l'administrateur pour régler la situation.";
						return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
					}
				}

				/* Register the claim */

				claims[interaction.user.id] = steamId;
				fs.writeFile("./processFiles/claims.json", JSON.stringify(claims), err => {
					if (err) {
						console.log("Error writing claims file:", err);
						return interaction.reply({
							content: interaction.locale == 'fr' ? 
								"ERREUR : quelque chose a cassé en essayant d'enregistrer les changements. Ce n'est pas ta faute. Blâme <@169899983263236097>." :
								"ERROR : something went wrong writing your claim. This is not your fault. Blame <@169899983263236097>.", 
							ephemeral: true 
						});
					}
				});

				const names = stats['playerStats'][steamId]['names'];

				responseEN = `<@${interaction.user.id}> just claimed '${names[0]}' as his ArmA3 in-game name.`;
				responseFR = `<@${interaction.user.id}> a enregistré '${names[0]}' comme son nom de jeu sur ArmA3.`;

				if (names.length > 1) {
					responseEN += " (other former names: ";
					responseFR += " (autres noms utilisés: ";
					for (let i = 1; i < names.length - 1; i++) {
						responseEN += names[i] + ", ";
						responseFR += names[i] + ", ";
					}
					responseEN += names[names.length - 1] + ").";
					responseFR += names[names.length - 1] + ").";
				} else {
					responseEN += ".";
					responseFR += ".";
				}

				interaction.channel.send("------------------ [FR] ------------------\n" + responseFR + "\n\n------------------ [EN] ------------------\n" + responseEN);
				interaction.reply({ content: `.`});
				interaction.deleteReply();
			} else {
				return interaction.reply({ 
					content: interaction.locale == 'fr' ? 
						"Il semblerait que tu ai déjà un nom ou ID Steam revendiqué. Tu peux obtenir plus d'information avec la commande /claim-info.\n"
							+ "Si besoin, tu peux utiliser /unclaim pour te désenregistrer puis réessayer." :
						"It appears you already have a claim registered. You can find more information on your current claim using the /claim-info command.\n"
							+ "Should you find that this claim is not correct, you can remove it with /unclaim and then try again.",
					ephemeral: true
				});
			}

		} catch (err) {
			console.log("File parse failed:", err);
			return interaction.reply({
				content: interaction.locale == 'fr' ? 
					"ERREUR : quelque chose a cassé en essayant d'accéder aux enregistrements. Ce n'est pas ta faute. Blâme <@169899983263236097>." :
					"ERROR : something went wrong trying to access the claims. This is not your fault. Blame <@169899983263236097>.", 
				ephemeral: true
			});
		}

		return;
	},
};
