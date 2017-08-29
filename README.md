# Madden Companion Exporter

This app will export data from the Companion App to a firebase database.

## Installation

Click Fork. Then copy your url path.
```
git clone [your git url]
cd Madden-Companion-Exporter
npm install
```


## Usage

To run this application locally (no real use to run locally):
```
npm run start
```

## Setup

### Create a firebase account and database
Go here: http://firebase.google.com/ and create an account or login.
Next, create an application.

### Go into the app.js file
Complete the todos
Commit the changes
```
git add *
git commit -m "Update app.js with firebase info"
git Push
```

### Create a Heroku project
Go here: https://dashboard.heroku.com/ and create an account or login.
Next, create an application.
Then, click on the new application and go to the Deploy tab.
Under deployment method, connect to your github repo of this project.
Then go ahead and do a manual deploy.
Lastly, figure out the url to your app.

### Go to the Companion App
Go to the league's export page you want. Enter in the url of your heroku app.
The data will then be in your firebase database to do as you wish.
Either download it or use the firebase database to power your website.

### Clearing previous exports
Clear all previous exports in your firebase db by opening the page 'http://\<yourapp\>.herokuapp.com/delete' in your web browser.

## Contributing

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request
