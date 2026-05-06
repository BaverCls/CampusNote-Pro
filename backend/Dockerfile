# Build stage — dependency layer caching for faster rebuilds
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

# Run stage — minimal JRE image
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
# Render dinamik PORT env'ini okur; JVM heap Render free tier (512MB) için optimize
ENTRYPOINT ["sh", "-c", "java -Xms128m -Xmx384m -Dserver.port=${PORT:-8080} -jar app.jar"]
