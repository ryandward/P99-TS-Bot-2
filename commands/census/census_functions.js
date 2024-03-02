import { SlashCommandBuilder } from 'discord.js';
import { ILike } from 'typeorm';
import { AppDataSource } from '../../app_data.js';
import { ActiveToons } from '../../entities/ActiveToons.js';
import { Census } from '../../entities/Census.js';
import { ClassDefinitions } from '../../entities/ClassDefinitions.js';
import { Dkp } from '../../entities/Dkp.js';
export function declareTemplate(status) {
    return new SlashCommandBuilder()
        .setName(status)
        .setDescription(`Declare character as "${status}"`)
        .addStringOption(option => option.setName('name').setDescription('The name of the character').setRequired(true))
        .addNumberOption(option => option.setName('level').setDescription('The level of the character').setRequired(true))
        .addStringOption(option => option
        .setName('class')
        .setDescription('The class of the character')
        .setRequired(true)
        .setAutocomplete(true));
}
export async function declare(DiscordId, Status, Name, Level, CharacterClass) {
    const newToon = new ActiveToons();
    newToon.DiscordId = DiscordId;
    newToon.Status = Status;
    newToon.Name = Name;
    newToon.Level = Level;
    newToon.CharacterClass = CharacterClass;
    return AppDataSource.manager
        .save(newToon)
        .then(() => {
        return `:white_check_mark: <@${DiscordId}>'s \`${Name}\` is now a level \`${Level}\` \`${Status}\` \`${CharacterClass}\`!`;
    })
        .catch(error => {
        return `Error declaring ${Name}: ${error}`;
    });
}
export async function suggestCharacterClasses(partialName) {
    const options = {
        where: {
            ClassName: ILike(`%${partialName}%`),
        },
        order: { LevelAttained: 'DESC' },
        take: 20,
    };
    return await AppDataSource.manager.find(ClassDefinitions, options);
}
export async function insertUser(DiscordId) {
    // Try to find a user with the given DiscordId
    const user = await AppDataSource.manager.findOne(Dkp, { where: { DiscordId } });
    if (!user) {
        const newUser = new Dkp();
        newUser.DiscordId = DiscordId;
        newUser.EarnedDkp = 5;
        await AppDataSource.manager.save(newUser);
        return true;
    }
    // If the user does exist, return it
    return false;
}
export async function toonExists(Name) {
    const toon = await AppDataSource.manager.findOne(Census, { where: { Name } });
    if (toon)
        throw new Error(`:x: ${Name} already exists`);
    return Name;
}
