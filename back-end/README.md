To run fastapi server:
In /back-end
1. create an python environment: python3 -m venv venv
2. go to venv: 
  linux/macos: source .venv/bin/activate
  window: 
    in powershell: .\venv\Scripts\Activate.ps1

3. download python libraries: pip install -r requirements.txt
4. run sever: uvicorn main:app | run dev server: uvicorn main:app --reload  

  UPDATED:
clone repo

set up env in database/back-end like the envexample

use a terminal to start database from /database: docker compose -f docker-compose_test.yaml 

from back-end start a venv: python -m venv venv

activate based on your shell

install requirements

on another terminal: uvicorn main:app --reload
