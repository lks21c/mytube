FROM node:24-alpine
WORKDIR /app/mytube
ENV NEXT_TELEMETRY_DISABLED=1 PUPPETEER_SKIP_DOWNLOAD=true PORT=3434
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 3434
ENTRYPOINT ["/entrypoint.sh"]
