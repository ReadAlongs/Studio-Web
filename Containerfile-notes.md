### Launch the container with:

    podman run --rm -it -v "$(pwd)":/work:Z -e HOME=/work ras-web bash -l

### Run Angular unit tests:

    export CHROME_BIN=/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-linux64/chrome-headless-shell
    cd $HOME && npx nx test:once studio-web

### Launch the back-end API with:

    . /RAS-venv/bin/activate && uvicorn readalongs.web_api:web_api_app &

### Launch the Studio-Web servers with:

    cd $HOME && npx nx run-many --targets=serve,serve-fr,serve-es --projects=web-component,studio-web --parallel 6

### Connect back into the container from another window:

    podman container list   --- copy running container name
    podman exec -it container_name bash -l

or if you just have one container running:

    podman exec -it $(podman container list | tail -1 | sed 's/.* //') bash -l

### Run the end to end tests:

    # This does not work yet, but that's my goal:
    cd $HOME && npx nx e2e studio-web
