import argparse
import json
import re
import requests
import os


def get_games_url(steamid: str) -> str:
    """Get the URL to the owned game page for a given SteamID

    Args:
        steamid (str): SteamID64 of user

    Returns:
        str: URL to owned game page
    """
    return f"https://steamcommunity.com/profiles/{steamid}/games/?tab=all"


def save_to_json(directory: str, steamid: str, user_data: dict):
    """Save a list of owned games into a .json file

    Args:
        directory (str): Directory to write output file to
        steamid (str): SteamID of user
        user_data (dict): New data to write to file
    """
    os.makedirs(directory, exist_ok=True)
    output_file = os.path.join(directory, f"{steamid}.json")
    with open(output_file, "w") as f:
        json.dump(user_data, f)


def get_appid_list(content: str):
    """Extract a list of owned AppIDs from a page

    Args:
        content (str): Content from a Steam games page

    Returns:
        list[str]: List of AppIDs
    """
    pattern = re.compile("var rgGames = (\[.*\])")
    result = pattern.search(content)
    if result:
        json_response = result.group(1)
        games_response = json.loads(json_response)
        return [str(game.get("appid")) for game in games_response]
    else:
        return []


def load_existing_games_list(steamid: str, output: str):
    try:
        with open(output_file, "r") as f:
            return json.load(f)
    except:
        return {}


def load_master_games_list():
    try:
        with open("./src/data/games_master_list.json", "r") as f:
            all_games = json.load(f)
            return all_games.get("steam_games", {}).keys()
    except Exception as e:
        print("Failed to load master games list.", e)
        return []


def load_discord_link_list():
    try:
        with open("./src/data/temp_discord_link.json", "r") as f:
            return json.load(f).values()
    except:
        print("Failed to load Discord link list.")
        return []


def scrape_id(steamid: str, output: str, valid_game_ids):
    # Load any existing scraped games
    # We don't want to override non-steam games (or other file info)
    user_game_data = load_existing_games_list(steamid, output)

    # Load games page
    url = get_games_url(steamid)
    try:
        page_content = requests.get(url).text
    except Exception as e:
        print("Failed to retrieve game data from Steam", e)
        raise e

    # Extract game IDs from page and save output
    games = get_appid_list(page_content)
    games_filtered = [game_id for game_id in games if game_id in valid_game_ids]

    # Don't save if we have 0 games (something has gone wrong)
    if len(games_filtered) < 1:
        return

    # Don't save if we've decreased in games
    if len(games_filtered) < user_game_data.get("steam_games", []):
        print(steamid, "has decreased in games! Please investigate.")
        return

    # Update & save
    user_game_data["steam_games"] = games_filtered
    save_to_json(output, steamid, user_game_data)


def main(args):
    valid_game_ids = load_master_games_list()
    users = load_discord_link_list() if args.all else args.users
    if not users:
        return

    for user in users:
        scrape_id(user, args.output, valid_game_ids)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Scrape a list of owned AppIDs for a given Steam account")
    parser.add_argument("-all", help="Scrape everyone from the Discord link list?", action="store_true")
    parser.add_argument("--users", nargs="*", help="SteamID64 to scrape owned games from")
    parser.add_argument(
        "--output",
        default="owned_games",
        help="Output directory for resulting .json files",
    )
    args = parser.parse_args()
    main(args)
