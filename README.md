# Partio-ohjelmasovellus backend

# 1. Project purpose

Partiolaiset Kompassi is a progressive web app made mainly for mobile devices. This is the backend repository of the application. Main purpose of the app is to store and show scout members's completed achievement badges. Groupleaders are also able to give new achievement badges to their groupmembers. Users that are not logged in can view different tasks and their info.

# 2. Architecture

This backend application and Postgre database are deployed to an Azure.
This application is an Rest API for pos-frontend. It fetches userprofile data from Kuksa(rest-kehatieto), uses partio-id as a sign-in method and stores user's activity achievements data to pos-db.

# 3. Development environment

## 3.1. Prerequisites, and what to do first

### Database

You can start database by running `docker-compose up`.
You can create needed tables by running `yarn migrate-up`.

### Ngrok

Install ngrok, it is preferred to use Homebrew `brew cask install ngrok`.
Get content for ngrok-config from 1Password and place it to `~/.ngrok2/ngrok.yml`. Also edit your `/etc/hosts` and add `partio.ngrok.io` as a hostname for 127.0.0.1
Start ngrok with `yarn ngrok` or alternatively `ngrok start partio`.

### Environmental variables

Get a working .env file from 1Password.

## 3.2. Run tests

No tests at the moment.

## 3.3. Start the application locally

### 3.3.1 HTTP

To start the dev env run `yarn dev`.

### 3.3.2 HTTPS

NOTE: You will need to generate certificates for the localhost https environment. See the steps below.

To start the app in https mode

- run `yarn dev` (requires that you have the certificate files in the `certs` folder)

To generate the required certificate follow these steps (Mac):<br>
NOTE 1: Make sure you have all the https related environment variables set (see .env.example).<br>
NOTE 2: If you've already created and added the root key and root certificate during the frontend https setup you can skip step 1.<br>

1. First create a folder (e.g. `certificates`) somewhere on your Mac
   - for example to your Work/Projects folder if you have them or your Desktop/Downloads folder
   - If you created the folder in finder open a terminal and `cd` to the folder
   - Next run the following commands to create the required files for generating the certificates
     - Create a root key: `openssl genrsa -des3 -out rootCA.key 2048`
     - Create RootCA.key pass phrase when terminal asks for it and save it somewhere (You're going to need it later)
     - Create a root certificate: `openssl req -x509 -new -nodes -key rootCA.key -sha256 -days 1024 -out rootCA.pem`
       - It's enough to only fill some fields here. E.g. Country as `fi` and location as `Helsinki`
   - Next you need to add the created root certificate as trusted in your Keychain Access application
     - Open Keychain Access
     - Select `File` -> `Import items...` from the app menu
     - Navigate to the folder where you created
     - Select System from the left side menu and then the Certificates tab
     - Double-click the certificate you added and change its Trust setting to Always Trust
2. Create a separate folder for backend inside your certificates folder: `mkdir backend`

   - Create a `server.csr.cnf` file inside the `backend` folder with the following information

     - ```
       [req]
       default_bits = 2048
        prompt = no
       default_md = sha256
       distinguished_name = dn

       [dn]
       C=fi
       L=Helsinki
       CN = pos-api-dev.ngrok.io
       ```

   - Create a `v3.ext` file inside the `backend` folder with the following information

     - ```
       authorityKeyIdentifier=keyid,issuer
       basicConstraints=CA:FALSE
       keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
       subjectAltName = @alt_names

       [alt_names]
       DNS.1 = pos-api-dev.ngrok.io
       ```

   - Run `openssl req -new -sha256 -nodes -out server.csr -newkey rsa:2048 -keyout server.key -config <( cat backend/server.csr.cnf )`
   - Run `openssl x509 -req -in backend/server.csr -CA rootCA.pem -CAkey rootCA.key -CAcreateserial -out server.crt -days 500 -sha256 -extfile backend/v3.ext`
   - Now the certificates are ready so all you need to do is move the `server.crt` and `server.key` files inside the `backend` folder to the backend project
     - Create a `certs` folder inside the backend project
     - Move the `server.crt` and `server.key` inside the `certs` folder

3. Edit `~/.ngrok2/ngrok.yml`

   - `addr: 3001` should be changed to `addr: https://localhost:3001`

4. Run ngrok with `yarn ngrok`

5. Run `yarn dev` to start the app

## 3.4. Version control

When working on a new feature or fixing a bug always create a new branch from the master branch. When the feature or fix is complete create a pull request (from now on PR) for the branch. There should always be at least one or two reviewers for the PR and once the PR has been approved it can be merged to master.

# 4. Test environment

## 4.1. Access

TODO

## 4.2. Deployment

Anything pushed to the master branch is automatically deployed to the test environment.

## 4.3. Verifying that a deployment was successful

Make sure the GitHub action successfully completes and test environment is accessible and these things works:

- TODO

### 4.3.1. Automated test cases

Tests - should there be any - are automatically run during the GitHub workflow when things are pushed to the master branch.

### 4.3.2. Manual test cases

TODO

## 4.4. Rollback

As everything from the master branch is deployed to the test environment the only way to change what is deployed is to push new changes or reverting old commits.

## 4.5. Logs

TODO

## 4.6. Monitoring

TODO

## 5. Production environment

## 5.1. Access

TODO.

## 5.2. Deployment

Create a release in GitHub.

## 5.3. Verifying that a deployment was successful

Make sure the GitHub action successfully completes and production environment is accessible and these things works:

- TODO

### 5.3.1. Automated test cases

Tests - should there be any - are automatically run in the Github action flow.

### 5.3.2. Manual test cases

TODO

## 5.4. Rollback

Fix the release

## 5.5. Logs

TODO

## 5.6. Monitoring

TODO

## 6. Continuous integration

Github Actions is used for CI.

# 7. More useful information

## 7.1 Running migrations manually:

1. Go to azure portal https://portal.azure.com/#home
2. Select the database of the environment you want to run migrations to (production or staging)
3. Select "Connection security" from the left menu (under settings)
4. Add your IP to the allowed IP lists by clicking the "+ Add current client IP address (you.rip.add.ress)" button and the click the save button at the top left of the view
5. Next go back to the home screen and select the backend of the environment you want to run migrations to
6. Select Configuration from the menu on the left (under settings)
7. Copy the value of the DATABASE_URL
8. Here you have two choices:
   - 1. In your local dev environment run the following command: `DATABASE_URL=paste-the-value-from-part-7-here yarn migrate-up`
   - 2. Set the DATABASE_URL from part 7 to your local .env file and run: `yarn migrate-up`
9. Remove your IP address from the list allowed IP addresses:
   - Follow steps 1 to 3 of this guide
   - Click the delete icon to the right of your IP address in the list of IPs
   - Click save from the top left of the view
