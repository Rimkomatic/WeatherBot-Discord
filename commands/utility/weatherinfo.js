const { SlashCommandBuilder } = require('discord.js');
const { fetchWeatherApi } = require('openmeteo')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('weather')
		.setDescription('Provides information about weather.')
    .addStringOption(option =>
		    option.setName('location')
			     .setDescription('Enter the location')
		 	     .setRequired(true)
    ),
	
  
  async execute(interaction) {
         await interaction.deferReply(); // Defer the reply as the request may take time

         const location = interaction.options.getString('location')
         try {
            const coordinates = await getCoordinates(location);
            
            if (!coordinates) {
                return interaction.followUp('Could not find the location.');
            }

            const weatherData = await getWeatherData(coordinates);
            if (!weatherData) {
                return interaction.followUp('Could not fetch weather data.');
            }

            const weatherSentence = weatherDataToSentence(weatherData , location);
            await interaction.followUp(weatherSentence);
        } catch (error) {
            console.error('Error executing command:', error);
            await interaction.followUp('An error occurred while fetching the weather information.');
        }        
  }
}

const {apiKey} = require("./../../config.json")

async function getCoordinates(text) 
{
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(text)}&format=json&apiKey=${apiKey}`;

    console.log(url)

    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(url);
    //const response = await fetch(https://api.geoapify.com/v1/geocode/search?text=kolkata&format=json&apiKey=YOUR_API_KEY);
        
        const data = await response.json();
    
        
        return [data.results[0].lon, data.results[0].lat ]
    } catch (error) {
        console.error('Error fetching coordinates:', error);
        return null;
    }
}

async function getWeatherData(coordinates) {
    const fetch = (await import('node-fetch')).default;
    const [latitude, longitude] = coordinates;
    //const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&current=temperature_2m,relative_humidity_2m,apparent_temperature,cloud_cover,wind_speed_10m,wind_direction_10m,precipitation,snowfall,visibility`;
    //console.log(url)
    
    const params = {
	      "latitude": coordinates[1],
	      "longitude": coordinates[0],
	      //"current": ["temperature_2m","relative_humidity_2m", "apparent_temperature" , "cloud_cover" , "wind_speed_10m" , "wind_direction_10m" , "precipitation" , "snowfall" , "visibility"],
        "current": ["temperature_2m", "relative_humidity_2m", "apparent_temperature", "precipitation", "rain", "showers", "snowfall", "weather_code", "cloud_cover", "wind_speed_10m", "wind_gusts_10m"],
        "forecast_days": 1 
    }
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${params.latitude}&longitude=${params.longitude}&current=temperature_2m&current=relative_humidity_2m&current=apparent_temperature&current=cloud_cover&current=wind_speed_10m&current=wind_direction_10m&current=precipitation&current=snowfall&current=visibility`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();

        return data;
      
    } catch (error) {
        console.error('Error fetching weather data:', error);
        return null;
    }
}

function weatherDataToSentence(weatherData , location) {
    const current = weatherData.current;
    const currentUnits = weatherData.current_units;
    
    const sentence = `At ${current.time}, in your location (${location}) the temperature is ${current.temperature_2m} ${currentUnits.temperature_2m}. 
    The relative humidity is ${current.relative_humidity_2m} ${currentUnits.relative_humidity_2m}, 
    and it feels like ${current.apparent_temperature} ${currentUnits.apparent_temperature}. 
    The cloud cover is ${current.cloud_cover} ${currentUnits.cloud_cover}, 
    with a wind speed of ${current.wind_speed_10m} ${currentUnits.wind_speed_10m} coming from ${current.wind_direction_10m}°. 
    There is ${current.precipitation} ${currentUnits.precipitation} of precipitation, 
    ${current.snowfall} ${currentUnits.snowfall} of snowfall, 
    and the visibility is ${current.visibility} ${currentUnits.visibility}.`;

    return sentence.replace(/\s+/g, ' ').trim(); // Clean up any extra spaces/newlines
}
