# Partio-ohjelmasovellus backend

# 1. Project purpose

TODO

# 2. Architecture

This backend application and Postgre database are deployed to an Azure.

# 3. Development environment

## 3.1. Prerequisites, and what to do first

### Database

You can start database by running `docker-compose up`.
You can create needed tables by running `yarn migrate-up`.

### Ngrok

Get content for ngrok-config from LastPass and place it to `~/.ngrok2/ngrok.yml`. Also edit your `/etc/hosts` and add `partio.ngrok.io` as a hostname for 127.0.0.1

### Environmental variables

Get a working .env file from LastPass.

## 3.2. Run tests

No tests at the moment.

## 3.3. Start the application locally

To start the dev env run `yarn start`.

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
