import './App.css'
import {useEffect, useState} from "react";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faArrowDownAZ, faArrowUpZA, faRotateRight} from '@fortawesome/free-solid-svg-icons';

interface PokemonDetails {
    name: string,
    id: number,
    types: {
        slot: number,
        type: {
            name: string,
            url: string
        }
    }[],
    sprites: {
        other: {
            "official-artwork": {
                front_default: string
            }
        }
    }
}

/*{
    name: "pikachu",
        id: 25,
    types: [{
    slot: 1,
    type: {
        name: "electric",
        url: ""
    }
}],
    sprites: {
    other: {
        "official-artwork": {
            front_default: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png"
        }
    }
}
}*/

interface Pokemon {
    name: string,
    url: string
}

interface PokemonType {
    slot: number,
    type: {
        name: string,
        url: string
    }
}

interface IconTypeMap {
    [name: string]: {
        name_icon: string,
        symbol_icon: string
    }
}

function App() {

    const [originalDetailedList, setOriginalDetailedList] = useState<PokemonDetails[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchedValue, setSearchedValue] = useState<string>('');
    const [typeOptions, setTypeOptions] = useState<PokemonType[]>([]);
    const [selectedType, setSelectedType] = useState<string>('');
    const [mapIconTypes, setMapIconTypes] = useState<IconTypeMap>({});
    const [sortOrder, setSortOrder] = useState<"initial" | "a-z" | "z-a">("initial");

    const getDisplayList = (): PokemonDetails[] => {
        let list = originalDetailedList;

        if (searchedValue.trim() !== "") {
            list = list.filter((pokemon) =>
                pokemon.name.toLowerCase().includes(searchedValue.toLowerCase())
            );
        }

        if (selectedType !== "") {
            list = list.filter((pokemon) =>
                pokemon.types.some((t) => t.type.name.toLowerCase() === selectedType.toLowerCase())
            );
        }

        if (sortOrder === "a-z" || sortOrder === "z-a") {
            const sortFn = (a: PokemonDetails, b: PokemonDetails) => {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                const comparison = nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
                return sortOrder === "a-z" ? comparison : -comparison;
            };
            list = [...list].sort(sortFn);
        }

        return list;
    };

    const populateTypeOptions = async (detailedList: PokemonDetails[]) => {
        const typesMap = new Map<string, PokemonType>();

        detailedList.forEach(el => {
            el.types.forEach((type) => {
                typesMap.set(type.type.name, type);
            })
        })

        const uniqueTypes = Array.from(typesMap.values());
        console.log("types created", uniqueTypes);

        setTypeOptions(uniqueTypes);
        await getMapTypesIcon(uniqueTypes);
    }

    const getMapTypesIcon = async (typesList: PokemonType[]) => {
        try {
            const types = await Promise.all(typesList.map(async (type) => {
                const response = await fetch(type.type.url);

                if (!response.ok) {
                    throw new Error(`Unable to get map type "${type.type.name}"`);
                }

                return response.json();
            }));
            const mapIcons = new Map<string, {name_icon: string, symbol_icon: string}>();
            types.forEach((type) => {
                const typeIcons = {
                    name_icon: type.sprites["generation-vii"]["lets-go-pikachu-lets-go-eevee"].name_icon,
                    symbol_icon: type.sprites["generation-vii"]["lets-go-pikachu-lets-go-eevee"].symbol_icon
                }
              mapIcons.set(type.name, typeIcons);
            })

            setMapIconTypes(Object.fromEntries(mapIcons));
        } catch (error) {
            console.error("Error getting map types", error);
        }
    }

    useEffect(() => {
        const fetchPokemonDetailedList = async (pokemonList: Pokemon[]) => {
            try {
                const detailedList = await Promise.all(pokemonList.map(async (pokemon) => {
                    const response = await fetch(pokemon.url)

                    if (!response.ok) {
                        throw new Error(`Error ${response.status}`);
                    }

                    return response.json();
                }))
                console.log("detailed list fetched", detailedList)
                setOriginalDetailedList(detailedList)

                await populateTypeOptions(detailedList)
            } catch (error) {
                console.error("Error fetching pokemon details:", error)
            }
        }

        const fetchPokemonList = async () => {
            try {
                const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=50")

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json()
                console.log("data fetched", data)

                await fetchPokemonDetailedList(data.results)
            } catch (error) {
                console.error("Error fetching pokemon list:", error)
            }
        }

        fetchPokemonList()
            .finally(() => {
                setLoading(false)
            })
    }, []);

    const handleSearch = (query: string) => {
        setSearchedValue(query);
    };

    const handleTypeFiltering = (type: string) => {
        setSelectedType(type);
    };

    const toggleSort = () => {
        setSortOrder((prev) => {
            if (prev === "initial") return "a-z";
            if (prev === "a-z") return "z-a";
            return "initial";
        });
    };

    const clearAll = () => {
        setSortOrder("initial");
        setSearchedValue("");
        setSelectedType("");
    };

    const pokemonDetailsCard = (pokemon: PokemonDetails) => {
        return (
            <div key={pokemon.id} className="col-span-6 md:col-span-4 xl:col-span-2 bg-slate-100 rounded-3xl px-5 py-3 shadow-sm hover:shadow-md hover:bg-slate-50 transition-shadow cursor-pointer active:bg-slate-200/70">
                <p className="text-gray-500 font-medium">ID: {String(pokemon.id).padStart(4, "0")}</p>
                <img src={pokemon.sprites.other["official-artwork"].front_default} alt={pokemon.name}
                     className="w-full h-auto mb-4"/>
                <div className="flex justify-between">
                    <p className="text-lg font-medium mb-1 uppercase">{pokemon.name}</p>
                    <div className="flex gap-2">
                        {pokemon.types.map(type => (
                            <img
                                key={type.type.name}
                                src={mapIconTypes[type.type.name]?.symbol_icon}
                                alt={type.type.name}
                                className="w-6 h-6"
                            />
                        ))}

                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            {
                loading && <p>Loading...</p>
            }
            {
                !loading &&
                <>
                    <div className="m-4 flex flex-col gap-4">
                        <div className="flex flex-col">
                            <p className="text-3xl font-bold">Pokedex</p>
                            {/*<p className="text-lg font-medium text-neutral-700">Click on a card to check pokemon's details</p>*/}
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                            <div className="flex flex-col">
                                <input
                                    type="text"
                                    value={searchedValue}
                                    onChange={(e) => {
                                        handleSearch(e.target.value);
                                    }}
                                    placeholder="Search by name..."
                                    className="border border-gray-500 rounded-lg ps-3 pe-5 w-fit h-8"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={toggleSort}
                                title={
                                    sortOrder === "initial" ? "Sort: initial order (sort A->Z)" :
                                    sortOrder === "a-z" ? "Sort: A -> Z (sort Z->A)" :
                                    "Sort: Z → A (back to initial)"
                                }
                                className="rounded-lg px-3 py-1 h-8 border border-gray-300 w-26 bg-slate-200 cursor-pointer hover:brightness-102 active:brightness-98 flex items-center justify-center transition-colors"
                            >
                                <p className="text-sm me-2 font-medium">
                                    {sortOrder === "initial" ? "Sort" : sortOrder === "a-z" ? "A → Z" : "Z → A"}
                                </p>
                                <FontAwesomeIcon
                                    icon={
                                        sortOrder === "initial" ? faArrowDownAZ :
                                        sortOrder === "a-z" ? faArrowDownAZ :
                                        faArrowUpZA
                                    }
                                    style={{
                                        opacity: sortOrder === "initial" ? 0.5 : 1
                                    }}
                                />
                            </button>
                            <select
                                value={selectedType}
                                onChange={(event) => {
                                    handleTypeFiltering(event.target.value)
                                }}
                                className="border border-gray-500 rounded-lg px-1 w-fit h-8"
                            >
                                <option value="">All types</option>
                                {
                                    typeOptions.map((type) => (
                                        <option key={type.type.name} value={type.type.name}>{type.type.name[0].toUpperCase() + type.type.name.slice(1)}</option>
                                    ))
                                }
                            </select>
                            <button
                                type="button"
                                onClick={clearAll}
                                title="Reset filters & sort"
                                className="rounded-lg px-3 py-1 h-8 border border-gray-300 bg-slate-200 cursor-pointer hover:brightness-102 active:brightness-98 flex items-center justify-center"
                            >
                                <FontAwesomeIcon icon={faRotateRight} className="text-sm" />
                            </button>
                        </div>
                        <div className="grid grid-cols-12 gap-4">
                            {getDisplayList().map((pokemon) => (
                                pokemonDetailsCard(pokemon)
                            ))}
                        </div>
                    </div>
                </>
            }
        </>
    )
}

export default App;
