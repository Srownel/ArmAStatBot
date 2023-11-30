const fs = require('fs');

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('claim-info')
		.setDescription("See the information relating to your current claim."),
	async execute(interaction) {

		// READ JSON
		var jsonClaimsString = fs.readFileSync("./processFiles/claims.json", "utf8");
		var jsonDataString = fs.readFileSync("./processFiles/data.json", "utf8");

		try {
			var claims = JSON.parse(jsonClaimsString);
			var stats = JSON.parse(jsonDataString);

			var responseEN;
			var responseFR;

			const steamId = claims[interaction.user.id];

			if (steamId === undefined) {
				responseEN = "It doesn't seem like you currently have a claim registered.\n\n"
					+ "A claim is the link between your discord account and your in-game ArmA name, or to be more precise, your unique Steam ID. "
					+ "You can establish a new claim with the /claim-name command, or /claim-id if you know your Steam ID (you can find it in your Account details on Steam).\n\n"
					+ "Once you have established your claim, you (and only you) will be able to access its statistics.\n"
					+ "We have no way of stopping you from claiming you are someone you're not. That is why claiming will display a public message in the channel that everyone can see. "
					+ "If you are seen abusing the system to access other people's data, a moderator will have to come sort the mess out and decide what to do with you. "
					+ "Please don't make the moderator have to come. Be a grown-up. I believe in you.\n\n"
					+ "If you made a wrong claim or want to remove your claim for any reason, you can always use /unclaim, so don't panic. "
					+ "There is currently no way to claim multiple steam accounts at once. I was too lazy to program something that probably isn't needed. Blame <@169899983263236097>.";
				responseFR = "Il semble que ce compte discord n'ai pas encore revendiqué de nom ou d'ID Steam.\n\n"
					+ "Une revendication est un lien entre ton compte discord et ton nom de jeu ArmA, ou pour être plus précis, ton ID Steam unique. "
					+ "Une nouvelle revendication peut être enregistrée avec la commande /claim-name, ou /claim-id si tu connais ton ID Steam (tu peux le trouver dans les Détails du compte sur Steam).\n\n"
					+ "Une fois votre revendication établie, tes statistiques ne seront accessibles qu'à toi et personne d'autre.\n"
					+ "Il nous est impossible d'empêcher quelqu'un de revendiquer un nom qui n'est pas le sien. C'est pourquoi revendiquer envoie un message public dans le channel que tout le monde peut voir. "
					+ "Si tu es vu en train d'abuser du système pour accéder aux stats des autres, un modérateur va devoir venir pour gérer ton cas et décider quoi faire de toi. "
					+ "S'il-te-plaît ne force pas le modérateur à venir. Soit sage. J'ai confiance en toi.\n\n"
					+ "Si tu as revendiqué le mauvais nom ou que tu veux te désenregistrer pour une quelconque raison, tu peux toujours utiliser /unclaim, donc pas de panique. "
					+ "Il n'y a pour le moment pas de moyen d'enregistrer plusieurs comptes Steam à la fois. J'avais trop la flemme de programmer quelque chose qui n'allait probablement jamais servir. Blame <@169899983263236097>.";
				return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
			}

			if (stats['playerStats'][steamId] === undefined) {
				responseEN = "You currently have a claim registered. However we have found no data associated to that claim.\n\n"
					+ "The currently registered Steam ID for your claim is: " + steamId + ".\n\n"
					+ "You can check your Steam ID from the 'Account Details' page of the Steam webpage or client when logged-in. "
					+ "If you are certain the ID registered in the claim is the same as the one of the Steam account you use to play ArmA, contact <@169899983263236097> to figure things out. "
					+ "Before it comes to that, please make sure the ID is correct. You might also want to first try using /claim-name to register your claim using your in-game name rather than your Steam Id. "
					+ "Remember to /unclaim first.";
				responseFR = "Tu as actuellement une revendication enregistrée. Cependant il semble qu'aucune donnée ne soit liée à celle-ci.\n\n"
					+ "Le Steam ID actuellement enregistré pour toi est: " + steamId + ".\n\n"
					+ "Tu peux trouver ton ID Steam depuis la page 'Détails du compte' sur le site ou le client Steam après t'être connecté. "
					+ "Si tu es certain que l'ID Steam enregistré est celui du compte Steam que tu as utilisé pour joeur sur ArmA, contact <@169899983263236097> pour régler le problème. "
					+ "Avant d'en arriver là, vérifie bien que l'ID est correct. Tu peux aussi tenter d'utiliser /claim-name pour rechercher tes stats en utilisant ton nom en jeu plutôt que ton ID Steam. ' . "
					+ "N'oublie pas de /unclaim d'abord.";
				return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });
			}

			const names = stats['playerStats'][steamId]['names'];

			responseEN = "You currently have a claim registered.\n\n"
				+ "Steam ID: " + steamId + ".\n"
				+ "Last in-game name used: " + names[0] + ".\n";
			responseFR = "Tu as actuellement une revendication enregistrée.\n\n"
				+ "ID Steam: " + steamId + ".\n"
				+ "Dernier pseudo utilisé: " + names[0] + ".\n";

			if (names.length > 1) {
				responseEN += "\nPreviously used names: ";
				responseFR += "\nAutres noms utilisés précédemment: ";
				for (let i = 1; i < names.length - 1; i++) {
					responseEN += names[i] + ", ";
					responseFR += names[i] + ", ";
				}
				responseEN += names[names.length - 1] + ".\n\n";
				responseFR += names[names.length - 1] + ".\n\n";
			}

			responseEN += "If this doesn't seem right to you, you can remove the claim using the /unclaim command. "
				+ "Remember that only one person can claim an account at a time and only that person can consult the associated data.\n"
				+ "Claiming an account that isn't yours is obviously strictly forbidden.";
			responseFR += "Si ces informations ne semblent pas être les tiennes, tu peux supprimer la revendication avec /unclaim. "
				+ "Rappelle toi qu'un compte ne peut être revendiqué que par une seule personne à la fois, et seule cette personne peut accéder aux statistiques.\n"
				+ "Revendiquer un compte qui n'est pas le tien est évidemment interdit et puni.";

			return interaction.reply({ content: interaction.locale == 'fr' ? responseFR : responseEN, ephemeral: true });

		} catch (err) {
			console.log("File parse failed:", err);
			return interaction.reply({
				content: interaction.locale == 'fr' ?
					"ERREUR : quelque chose a cassé en essayant d'accéder aux enregistrements. Ce n'est pas ta faute. Blâme <@169899983263236097>." :
					"ERROR : something went wrong trying to access the claims or stats. This is not your fault. Blame <@169899983263236097>.", 
				ephemeral: true
			});
		}
	},
};
