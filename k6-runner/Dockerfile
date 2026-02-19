FROM grafana/k6:1.6.1

WORKDIR /work

COPY tests/ ./tests/
COPY vendor/ ./vendor/

ENTRYPOINT ["k6"]
CMD ["run", "tests/synth.js"]
