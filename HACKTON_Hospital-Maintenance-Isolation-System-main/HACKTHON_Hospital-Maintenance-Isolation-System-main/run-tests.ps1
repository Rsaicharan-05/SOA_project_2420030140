# Script to run all unit and integration tests
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-25.0.4.7-hotspot"
& "C:\tools\apache-maven-3.9.11\bin\mvn.cmd" test
