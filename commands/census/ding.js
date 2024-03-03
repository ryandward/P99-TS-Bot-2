import { SlashCommandBuilder } from 'discord.js';
import _ from 'lodash';
import { ILike } from 'typeorm';
import { AppDataSource } from '../../app_data.js';
import { ActiveToons } from '../../entities/ActiveToons.js';
import { levelMustBeValid, toonMustExist } from './census_functions.js';
export const data = new SlashCommandBuilder()
    .setName('ding')
    .setDescription('Increment or set the level of a character')
    .addStringOption(option => option
    .setName('name')
    .setDescription('The name of the character')
    .setRequired(true)
    .setAutocomplete(true)
    .setMaxLength(24))
    .addIntegerOption(option => option
    .setName('level')
    .setDescription('The new level of the character (optional)')
    .setRequired(false)
    .setMinValue(1)
    .setMaxValue(60));
export async function autocomplete(interaction) {
    try {
        const focusedOption = interaction.options.getFocused(true);
        if (!focusedOption)
            return;
        const discordId = interaction.user.id;
        if (focusedOption.name === 'name') {
            const choices = {
                where: {
                    Name: ILike(`%${focusedOption.value}%`),
                    DiscordId: discordId,
                },
                take: 10,
            };
            const toons = await AppDataSource.manager.find(ActiveToons, choices);
            await interaction.respond(toons.map(toon => ({ name: toon.Name, value: toon.Name })));
        }
    }
    catch (error) {
        console.error('Error in autocomplete:', error);
    }
}
export const execute = async (interaction) => {
    try {
        const { options } = interaction;
        const name = _.capitalize(options.get('name')?.value);
        const level = options.get('level')?.value;
        const discordId = interaction.user.id;
        const toon = await toonMustExist(name);
        const newLevel = level ? level : Number(toon.Level) + 1;
        await levelMustBeValid(newLevel);
        await AppDataSource.manager.update(ActiveToons, { DiscordId: discordId, Name: name }, { Level: newLevel });
        return interaction.reply(`${level ? ':arrow_double_up:' : ':arrow_up:'} \`${name}\`'s level has been ${level ? 'set to' : 'incremented to'} \`${newLevel}\`!`);
    }
    catch (error) {
        if (error instanceof Error) {
            return interaction.reply({ content: error.message, ephemeral: true });
        }
    }
};
