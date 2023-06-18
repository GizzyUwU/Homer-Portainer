# Homer-Portainer

## Overview
Homer-Portainer is a tool designed to retrieve container names from the Portainer API and organize them into categories within your Homer configuration.

## Functionality
The purpose of Homer-Portainer is to extract container names from Portainer and assign them to one of three predefined categories: "Management," "Games," or "Tools." To ensure proper functionality, container names must adhere to the following format: "NAME-CATEGORY-HIDDEN." The "HIDDEN" section is optional, and if detected in the container name, the respective container will be excluded from the Homer configuration.

## Configuration
To use Homer-Portainer effectively, ensure that you have the following details available:

- Portainer URL: Specify the URL of your Portainer instance.
- Portainer API Key: Provide the API key associated with your Portainer account.

Additionally, the default category is set to "Tools" when a specific category is not detected. You can modify the default category in the code by locating the following line: 

```javascript
let containerCategory = category || 'DEFAULT CATEGORY';```
