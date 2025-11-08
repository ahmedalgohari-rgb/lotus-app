#!/usr/bin/env python3
"""
Update plantCareDatabase.json with kaynuna image URLs
- Remove 8 plants not on kaynuna
- Update 51 plants with kaynuna image URLs
"""

import json

# Plants to DELETE (not on kaynuna)
DELETE_PLANTS = [
    'aloe_vera',
    'dracaena_corn',
    'fiddle_leaf_fig',
    'hoya',
    'oxalis',
    'coffee_plant',
    'boston_fern',
    'cast_iron_plant'
]

# Kaynuna image URLs mapping
KAYNUNA_IMAGES = {
    "snake_plant": "https://kaynuna.co/cdn/shop/files/53499DEC-E916-43A5-8E9A-BCF6B52254AE.jpg",
    "golden_pothos": "https://kaynuna.co/cdn/shop/files/Golden_Pothos.jpg",
    "monstera_deliciosa": "https://kaynuna.co/cdn/shop/files/IMG_5369.jpg",
    "zz_plant": "https://kaynuna.co/cdn/shop/files/ZZ_Plants_16cm_30cm.jpg",
    "rubber_plant": "https://kaynuna.co/cdn/shop/files/IMG_5994.jpg",
    "peace_lily": "https://kaynuna.co/cdn/shop/files/Peace_Lilly_Plant.jpg",
    "spider_plant": "https://kaynuna.co/cdn/shop/files/Indoor_Spider_Plant.jpg",
    "philodendron": "https://kaynuna.co/cdn/shop/files/63A68211-4144-4D45-A499-AD6FC5457F58.jpg",
    "jade_plant": "https://kaynuna.co/cdn/shop/files/Gollum_Succulent.jpg",
    "arrowhead_vine": "https://kaynuna.co/cdn/shop/files/Arrowhead_in_brown_plastic_pot.jpg",
    "croton": "https://kaynuna.co/cdn/shop/files/IMG_57542.jpg",
    "peperomia": "https://kaynuna.co/cdn/shop/files/IMG_0689.jpg",
    "kalanchoe": "https://kaynuna.co/cdn/shop/files/Florist_Kalanchoe.jpg",
    "aglaonema": "https://kaynuna.co/cdn/shop/files/Aglaonema_Pink_Valentine.jpg",
    "calathea": "https://kaynuna.co/cdn/shop/files/Velvet_Plant.jpg",
    "maranta": "https://kaynuna.co/cdn/shop/files/IMG_37272.jpg",
    "dieffenbachia": "https://kaynuna.co/cdn/shop/files/Dieffenbachia.jpg",
    "schefflera": "https://kaynuna.co/cdn/shop/files/schefflera_variegated_20cm_25cm.jpg",
    "anthurium": "https://kaynuna.co/cdn/shop/files/Flamingo_flower_Red-Closeup.jpg",
    "begonia_rex": "https://kaynuna.co/cdn/shop/files/D631BDDD-2F2C-445C-B34A-ABE6745C3F5C.jpg",
    "alocasia": "https://kaynuna.co/cdn/shop/files/IMG_3349.jpg",
    "string_of_pearls": "https://kaynuna.co/cdn/shop/files/String_of_Pearls_Cairo_Egypt.jpg",
    "string_of_hearts": "https://kaynuna.co/cdn/shop/files/String_of_Hearts.jpg",
    "echeveria": "https://kaynuna.co/cdn/shop/files/Mexicaan_Rose_Succulent.jpg",
    "haworthia": "https://kaynuna.co/cdn/shop/files/Cathedral_Window_Haworthia.jpg",
    "pilea": "https://kaynuna.co/cdn/shop/files/Silver_Dollar_Succulent_Pot_Size_14cm.jpg",
    "fittonia": "https://kaynuna.co/cdn/shop/files/IMG_5938.jpg",
    "moth_orchid": "https://kaynuna.co/cdn/shop/files/Phalaenopsis_orchids_pink_and_yellow.jpg",
    "ctenanthe": "https://kaynuna.co/cdn/shop/files/Fishbone_in_Ceramic.jpg",
    "satin_pothos": "https://kaynuna.co/cdn/shop/files/BFA2E95C-9021-4ADF-A1DD-0290B008F80A.jpg",
    "birds_nest_fern": "https://kaynuna.co/cdn/shop/files/IMG_5838.jpg",
    "bamboo_palm": "https://kaynuna.co/cdn/shop/files/Bamboo_Palm.jpg",
    "madagascar_dragon_tree": "https://kaynuna.co/cdn/shop/files/IMG_2254.jpg",
    "english_ivy": "https://kaynuna.co/cdn/shop/files/IMG_1370.jpg",
    "lucky_bamboo": "https://kaynuna.co/cdn/shop/files/D4C1DB4A-5AE7-4B3D-92E1-184EEFC1F41F.jpg",
    "areca_palm": "https://kaynuna.co/cdn/shop/files/Areca_Palm.jpg",
    "philodendron_xanadu": "https://kaynuna.co/cdn/shop/files/xanadu.jpg",
    "christmas_cactus": "https://kaynuna.co/cdn/shop/files/Christmas_Cactus_in_shay_Clay_Pot.jpg",
    "polka_dot_begonia": "https://kaynuna.co/cdn/shop/files/D631BDDD-2F2C-445C-B34A-ABE6745C3F5C.jpg",
    "birds_of_paradise": "https://kaynuna.co/cdn/shop/files/Birds_of_paradise_3_sticks.jpg",
    "grape_ivy": "https://kaynuna.co/cdn/shop/files/image_41f3de13-824e-4c11-aadb-b7fa58b187e6.jpg",
    "song_of_india": "https://kaynuna.co/cdn/shop/files/63D4895E-C6FD-42B9-914B-CADE6762BE57.jpg",
    "string_of_bananas": "https://kaynuna.co/cdn/shop/files/String_of_Bananas_succulent.jpg",
    "guzmania": "https://kaynuna.co/cdn/shop/files/IMG_6383.jpg",
    "lithops": "https://kaynuna.co/cdn/shop/files/Livingstone_8cm.jpg",
    "venus_flytrap": "https://kaynuna.co/cdn/shop/files/A97ED20E-20E8-47E1-894B-409758B6A4DE.jpg",
    "ghost_plant": "https://kaynuna.co/cdn/shop/files/0DD51804-768A-4CB8-B3A0-6672309D6DE8.jpg",
    "tigers_jaw": "https://kaynuna.co/cdn/shop/files/IMG_0271.jpg",
    "corsican_stonecrop": "https://kaynuna.co/cdn/shop/files/Corsican_Stonecrop_Succulent-8cm.jpg",
    "dracaena_compacta": "https://kaynuna.co/cdn/shop/files/IMG_3419.jpg",
    "imperial_red_philodendron": "https://kaynuna.co/cdn/shop/files/philodendron_imperial_red.jpg"
}

def update_database():
    print("🌿 Loading plantCareDatabase.json...")

    # Read the database
    with open('/Users/ahmedalgohari/Lotus/src/data/plantCareDatabase.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    original_count = len(data['plants'])
    print(f"   Original plant count: {original_count}")

    # Filter out plants not on kaynuna
    print(f"\n❌ Removing {len(DELETE_PLANTS)} plants not on kaynuna...")
    data['plants'] = [plant for plant in data['plants'] if plant['id'] not in DELETE_PLANTS]
    deleted_count = original_count - len(data['plants'])
    print(f"   Deleted: {deleted_count} plants")
    print(f"   Remaining: {len(data['plants'])} plants")

    # Update image URLs for remaining plants
    print(f"\n✅ Updating image URLs with kaynuna sources...")
    updated_count = 0
    for plant in data['plants']:
        plant_id = plant['id']
        if plant_id in KAYNUNA_IMAGES:
            old_url = plant.get('image_url', 'No URL')
            new_url = KAYNUNA_IMAGES[plant_id]

            if old_url != new_url:
                plant['image_url'] = new_url
                updated_count += 1

                # Highlight priority fixes
                if plant_id in ['golden_pothos', 'peace_lily']:
                    print(f"   🚨 PRIORITY FIX: {plant_id}")
                    print(f"      OLD: {old_url[:60]}...")
                    print(f"      NEW: {new_url[:60]}...")

    print(f"   Updated {updated_count} plant images")

    # Write updated database back
    print(f"\n💾 Writing updated database...")
    with open('/Users/ahmedalgohari/Lotus/src/data/plantCareDatabase.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"   ✅ Database updated successfully!")
    print(f"\n📊 Final Stats:")
    print(f"   Total plants: {len(data['plants'])}")
    print(f"   Images updated: {updated_count}")
    print(f"   All images now sourced from kaynuna.co")

if __name__ == "__main__":
    update_database()
