pipeline {
    agent any

    environment {
        NODE_ENV = 'test'
        JWT_SECRET = 'ci_secret_key_testing_12345'
        CI = 'true'
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source repository from SCM...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing locked npm dependencies for Backend and Frontend...'
                dir('backend') {
                    sh label: 'Install Backend Dependencies', script: 'npm ci'
                }
                dir('frontend') {
                    sh label: 'Install Frontend Dependencies', script: 'npm ci'
                }
            }
        }

        stage('Backend Lint & Checks') {
            steps {
                echo 'Validating Node.js syntax and entrypoint configurations...'
                dir('backend') {
                    sh label: 'Validate Server Syntax', script: 'node --check server.js'
                    sh label: 'Validate Database Config', script: 'node --check config/db.js'
                    sh label: 'Validate Resilient Store', script: 'node --check services/dataStore.js'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                echo 'Compiling React Vite production bundle and Leaflet assets...'
                dir('frontend') {
                    sh label: 'Build Frontend Distributables', script: 'npm run build'
                }
            }
        }

        stage('Backend Tests') {
            steps {
                echo 'Executing Jest automated unit and integration test suites...'
                dir('backend') {
                    sh label: 'Run Backend Test Suites', script: 'npm test'
                }
            }
        }

        stage('Test Coverage') {
            steps {
                echo 'Generating Jest coverage reports (LCOV and text summaries)...'
                dir('backend') {
                    sh label: 'Generate Coverage Report', script: 'npm run test:coverage'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'backend/coverage/**', allowEmptyArchive: true
                }
            }
        }

        stage('Build Verification') {
            steps {
                echo 'Verifying production bundle artifacts and distribution integrity...'
                sh label: 'Verify Frontend Artifacts', script: '''
                    test -f frontend/dist/index.html && echo "Frontend bundle index.html successfully verified."
                    test -d frontend/dist/assets && echo "Frontend compiled assets directory verified."
                '''
            }
            post {
                always {
                    archiveArtifacts artifacts: 'frontend/dist/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'test-results/**', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        success {
            echo '==========================================================='
            echo ' CivicLens CI Pipeline completed with SUCCESS.'
            echo ' All unit, integration, coverage, and build checks passed.'
            echo '==========================================================='
        }
        failure {
            echo '==========================================================='
            echo ' CivicLens CI Pipeline encountered errors. Review stage logs.'
            echo '==========================================================='
        }
    }
}
