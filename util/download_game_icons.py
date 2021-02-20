import argparse
import json
import os
import requests


def get_image_url(steamid: str):
    return f"https://cdn.akamai.steamstatic.com/steam/apps/{steamid}/header.jpg"


def download_image(output: str, steamid: str):
    output_file = os.path.join(output, f"{steamid}.png")
    image_url = get_image_url(steamid)

    req = requests.get(image_url)
    if req.status_code == 200:
        with open(output_file, "wb") as f:
            f.write(req.content)


def load_master_games_list():
    try:
        with open("./src/data/games_master_list.json", "r") as f:
            all_games = json.load(f)
            return all_games.get("steam_games", {}).keys()
    except:
        print("Failed to load master games list.")
        return []


def main(output: str):
    game_ids_to_scrape = load_master_games_list()

    for game_id in game_ids_to_scrape:
        download_image(output, game_id)


if __name__ == "__main__":
    main("./assets/img/games")
