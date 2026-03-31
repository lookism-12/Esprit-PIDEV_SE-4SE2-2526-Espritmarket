@echo off
set "MAVEN_BIN=C:\Program Files\JetBrains\IntelliJ IDEA 2025.3\plugins\maven\lib\maven3\bin\mvn.cmd"
call "%MAVEN_BIN%" spring-boot:run -Dmaven.test.skip=true
