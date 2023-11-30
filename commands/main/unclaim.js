const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('unclaim')
		.setDescription("Remove any currently registered claim so you can set a new one.")
		.setDescriptionLocalization('fr', "Supprime le nom ou l'id steam actuellement enregistré pour ton compte discord.")
		.addStringOption(option => option.setName('areyousure')
			.setNameLocalization('fr', 'etesvoussur-e')
			.setDescription('You can always re-claim after if you mess up.')
			.setDescriptionLocalization('fr', 'Tu peux toujours te réenregistrer après si tu as fais une boulette.')
			.addChoices({ name: 'yes', name_localizations: { fr: 'oui' }, value: 'yes' })
			.setRequired(true)),
	async execute(interaction) {
		// READ AND UPDATE JSON
		var jsonString = fs.readFileSync("./processFiles/claims.json", "utf8");

		try {
			var claims = JSON.parse(jsonString);

			if (claims[interaction.user.id] === undefined) {
				return interaction.reply({ 
					content: interaction.locale == 'fr' ? 
						"On... a pas vraiment trouvé d'enregistrement à supprimer pour ton compte. Donc on a rien fait. Mais au moins maintenant t'es extra-sûr(e). Rien d'enregistré. Promis (tu peux vérifier avec /claim-info)." :
						"We... didn't really have a claim to remove for you. So we didn't do anything. But at least now we're extra-sure. No claim left. Promise (you can check with /claim-info).", 
					ephemeral: true 
				});
			} else {
				delete claims[interaction.user.id];

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

				return interaction.reply({
					content: interaction.locale == 'fr' ? 
						"Ton enregistrement a bien été supprimé. Utilise /claim-name ou /claim-id pour enregistrer un nouveau nom ou id steam." :
						"Your claim has been wiped successfully. See /claim-name or /claim-id to re-establish a new one.", 
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
	},
};
