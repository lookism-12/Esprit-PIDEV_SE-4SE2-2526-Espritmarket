@echo off
set "JAVA_HOME=C:\Users\Eya\.antigravity\extensions\redhat.java-1.12.0-win32-x64\jre\17.0.4.1-win32-x86_64"
set "PATH=%JAVA_HOME%\bin;%PATH%"
.\mvnw.cmd clean compile -DskipTests
