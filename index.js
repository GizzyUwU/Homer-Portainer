const fs = require('fs');
const yaml = require('js-yaml');
const axios = require('axios');
const schedule = require('node-schedule');
const homerConfigFile = '/app/config.yml';
const portainerApiUrl = process.env.PORTAINER_API_URL;
const portainerToken = process.env.PORTAINER_TOKEN;

// Calls Portainer API to get all running container's names
async function getRunningContainerNames(portainerApiUrl, portainerToken) {
  try {
    const response = await axios.get(`${portainerApiUrl}/endpoints/2/docker/containers/json`, {
      headers: {
        'X-API-Key': portainerToken,
      },
    });
    return response.data.map((container) => container.Names[0].replace('/', ''));
  } catch (error) {
    console.error('Error retrieving Docker container names:', error);
    return [];
  }
}

// Check's If the Contaienr name is valid
function isContainerNameValid(containerName) {
  // Check if the container name contains mixed numbers and letters
  if (/\d/.test(containerName) && /[a-zA-Z]/.test(containerName)) {
    return false;
  }

  // Check if the container name contains keywords that should be avoided
  const keywordsToAvoid = ['duplicate', 'invalid', 'reserved'];
  const lowerCaseContainerName = containerName.toLowerCase();
  return !keywordsToAvoid.some((keyword) => lowerCaseContainerName.includes(keyword));
}

// Check's if it already exist's in the homer config.yml
function isContainerExists(containerName, homerConfig) {
  const containerNameLower = containerName.toLowerCase();

  for (const service of homerConfig.services) {
    for (const item of service.items) {
      const itemNameLower = item.name.toLowerCase();

      // Check if the container name is an exact match
      if (itemNameLower === containerNameLower) {
        return true;
      }

      // Check if the container name contains the same words
      const itemNameWords = itemNameLower.split(/\W+/); // Split by non-word characters
      const containerNameWords = containerNameLower.split(/\W+/);

      // Check if all words in containerNameWords exist in itemNameWords
      if (
        containerNameWords.every((word) => itemNameWords.includes(word)) ||
        itemNameWords.some((word) => containerNameWords.includes(word))
      ) {
        return true;
      }
    }
  }

  return false;
}

// Add's/Update's the container to config.yml
function addOrUpdateContainer(containerName, newName, newNameCaps, imageName, category, homerConfig) {
  const containerNameLower = containerName.toLowerCase();

  // Check if the container already exists in the configuration
  const existingContainer = homerConfig.services
    .flatMap((service) => service.items)
    .find((item) => item.name.toLowerCase() === containerNameLower);

  if (existingContainer) {
    // Container exists, update the name
    existingContainer.name = newNameCaps;
    console.log(`Updated container name ${containerName} to ${newName} in Homer configuration.`);
  } else {
    // Container is new, add it to the configuration
    if (!isContainerExists(containerName, homerConfig)) {
      const newItem = {
        name: newNameCaps,
        logo: `assets/tools/${newName}.png`,
        subtitle: '',
        tag: category,
        url: '',
        target: '_blank',
      };

      homerConfig.services.forEach((service) => {
        if (service.name === category) {
          service.items.push(newItem);
        }
      });

      console.log(`Added container ${newName} to Homer configuration in category ${category}.`);
    } else {
      console.log(`Container ${newName} already exists in Homer configuration.`);
    }
  }
}

// Code what run's all functions, load's config.yml
async function run() {
  const imageNames = await getRunningContainerNames(portainerApiUrl, portainerToken);

  // Load Homer configuration from YAML file
  let homerConfig;
  try {
    const configContents = fs.readFileSync(homerConfigFile, 'utf8');
    homerConfig = yaml.load(configContents);
  } catch (error) {
    console.error('Error loading Homer configuration:', error);
    return;
  }

  for (const imageName of imageNames) {
    const [fullName, category, hidden] = imageName.split('-').map((part) => part.replace('£', ''));
    const containerName = fullName.replace(/_/g, ' ');

    if (containerName && !hidden) {
      const newName = containerName.toLowerCase();
      const newNameCaps = containerName;

      if (isContainerNameValid(newName)) {
        let containerCategory = category || 'Tools';

        const existingCategory = homerConfig.services.find(
          (service) => service.name.toLowerCase() === containerCategory.toLowerCase()
        );

        if (!existingCategory) {
          const existingCategory = homerConfig.services.find(
            (service) => service.name.toLowerCase() === "Tools"
          );
        }

        addOrUpdateContainer(containerName, newName, newNameCaps, imageName, containerCategory, homerConfig);
      }
    }
  }

  // Save updated Homer configuration to YAML file
  try {
    const updatedConfigContents = yaml.dump(homerConfig);
    fs.writeFileSync(homerConfigFile, updatedConfigContents, 'utf8');
    console.log('Homer configuration updated successfully.');
  } catch (error) {
    console.error('Error saving updated Homer configuration:', error);
  }
}

schedule.scheduleJob('*/10 * * * *', () => {
  run();
});

// Initial run
run();
