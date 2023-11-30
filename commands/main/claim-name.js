const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim-name')
		.setDescription("Claim an ArmA3 in-game name as yours. This action is public. Identity theft is not a joke Jim.")
		.setDescriptionLocalization('fr', 'Revendiquer un pseudo comme votre nom de jeu ArmA3. Cette action est exclusive et publique.')
		.addStringOption(option => option.setName('name')
			.setNameLocalization('fr', 'pseudo')
			.setDescription('Your ArmA3 in-game player name.')
			.setDescriptionLocalization('fr', 'Ton pseudo utilisé sur ArmA3.')
			.setRequired(true)),
	async execute(interaction) {
		const nameClaimed = interaction.options.getString('name');

		// READ AND UPDATE JSON
		var jsonString = fs.readFileSync("./processFiles/claims.json", "utf8");

		try {
			var claims = JSON.parse(jsonString);

			if (claims[interaction.user.id] === undefined) {
				var responseEN;
				var responseFR;

				var jsonDataString = fs.readFileSync("./processFiles/data.json", "utf8");
				var stats = JSON.parse(jsonDataString);

				var possibleIdClaimed = [];
				
				for (const playerIdAsAttribute in stats['playerStats']) {
					for (const playerName of stats['playerStats'][playerIdAsAttribute]['names']) {
						if (playerName === nameClaimed) {
							possibleIdClaimed.push(playerIdAsAttribute);
							break;
						}
					}
				}

				if (possibleIdClaimed.length == 0) {
					responseEN = "There doesn't seem to be a player matching that name in our data. Are you sure you wrote it right? (capital letters matter)\n"
						+ "You can try again or use /claim-id to claim with your unique Steam ID. "
						+ "You can find your Steam ID from the 'Account Details' page of the Steam webpage or client when logged-in.";
					responseFR = "Il semblerait qu'aucun joueur dece nom ne soit trouvable dans nos données. Es-tu sûr(e) de l'avoir bien écrit (les majuscules sont importantes)\n"
						+ "Tu peux réessayer ou utiliser /claim-id pour enregistrer ton ID Steam. "
						+ "Tu peux trouver ton ID Steam depuis la page 'Détails du compte' sur le site ou le client Steam après t'être connecté.";
					return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
				} else if (possibleIdClaimed.length > 1) {
					responseEN = "There seems to be more than one player using that name in our data. Sadly, we're going to need you to claim your account using the /claim-id command. "
						+ "For this you will need your unique Steam ID. You can find your Steam ID from the 'Account Details' page of the Steam webpage or client when logged-in."
					responseFR = "Il semblerait que plusieurs joueurs utilisent ce nom dans les données. Malheureusement, il va falloir enregistrer ton compte en utiliser la commande /claim-id. "
						+ "Pour cela, il faudra renseigner ton ID Steam. Tu peux trouver ton ID Steam depuis la page 'Détails du compte' sur le site ou le client Steam après t'être connecté."
					return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
				} else {

					/* Check if this id is not already claimed */

					for (const discordId in claims) {
						if (claims[discordId] == possibleIdClaimed[0]) {
							responseEN = "We have found your name among our known players, but it appears to be linked to an already claimed Steam ID :s\n"
								+ `The associated Steam ID is already claimed by <@${discordId}>.\n\n`
								+ "This Steam ID has been known to play under the following names: ";
							responseFR = "Ce nom a bien été trouvé parmis les joueurs présents dans nos données, mais il semblerait qu'il soit associé à un Steam ID déjà revendiqué :s\n"
								+ `L'ID Steam associé a déjà été enregistré par <@${discordId}>.\n\n`
								+ "Cet ID Steam a déjà joué sous les noms suivants: ";

							const names = stats['playerStats'][possibleIdClaimed[0]]['names'];

							for (let i = 0; i < names.length - 1; i++) {
								responseEN += names[i] + ", ";
								responseFR += names[i] + ", ";
							}
							responseEN += names[names.length - 1] + ".\n\n";
							responseFR += names[names.length - 1] + ".\n\n";
							
							responseEN += "Please check that you have correctly entered your in-game name (capital letters matter).\n"
								+ "If you believe that your account was illegitimately claimed, please contact the administrator to sort things out.\n\n"
								+ "(Do note that we have only found one player using this name in our data, so it is not a case of two players using the same name.)";
							responseFR += "Veille à vérifier que tu as bien renseigné le nom exact que tu utilises en jeu (les majuscules sont importantes).\n"
								+ "Si tu penses que ton nom a été revendiqué par quelqu'un d'illégitime, merci de contacter l'administrateur pour régler la situation.\n\n"
								+ "(Un unique joueur utilisant ce nom a été trouvé, donc il ne s'agit pas d'un cas où deux joueurs utilisent le même nom.)";
							return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
						}
					}

					claims[interaction.user.id] = possibleIdClaimed[0];

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

					const names = stats['playerStats'][possibleIdClaimed[0]]['names'];

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
				}

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
	}
}