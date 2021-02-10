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


def save_to_json(directory: str, steamid: str, games: list[str]):
    """Save a list of owned games into a .json file

    Args:
        directory (str): Directory to write output file to
        steamid (str): SteamID of user
        games (list[str]): List of AppIDs owned by that user
    """
    os.makedirs(directory, exist_ok=True)
    output_file = os.path.join(directory, f"{steamid}.json")
    with open(output_file, "w") as f:
        json.dump({"games": games}, f)


def get_appid_list(content: str) -> list[str]:
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


def main(steamid: str, output: str):
    # Load games page
    url = get_games_url(steamid)
    try:
        page_content = requests.get(url).text
    except Exception as e:
        print("Failed to retrieve game data from Steam", e)
        raise e

    # Extract game IDs from page and save output
    games = get_appid_list(page_content)
    save_to_json(output, steamid, games)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Scrape a list of owned AppIDs for a given Steam account"
    )
    parser.add_argument("steamid", help="SteamID64 to scrape owned games from")
    parser.add_argument(
        "--output",
        default="owned_games",
        help="Output directory for resulting .json files",
    )
    args = parser.parse_args()
    main(args.steamid, args.output)
