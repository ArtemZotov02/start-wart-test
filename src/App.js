import React, { useEffect, useState, useCallback } from 'react'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import './App.css'

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [activeHero, setActiveHero] = useState(null)
  const [heroes, setHeroes] = useState([])
  const [url, setUrl] = useState('https://sw-api.starnavi.io/people/')
  const [pages, setPages] = useState()
  
  const clickChangePage = (direction) => {
    if (direction === 'previous' && pages?.previousPage) {
      setUrl(pages.previousPage)
    } else if (direction === 'next' && pages?.nextPage) {
      setUrl(pages.nextPage)
    }
  }

  const fetchFilms = async (film) => {
    try {
      const response = await fetch(`https://sw-api.starnavi.io/films/${film}/`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Ошибка при получении фильмов:', error)
    }
  }

  const fetchStarship = async (starship) => {
    try {
      const response = await fetch(`https://sw-api.starnavi.io/starships/${starship}/`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Ошибка при получении транспорта:', error)
    }
  }

  const handleHeroClick = async (hero) => {
    setActiveHero(hero.name)
    const heroId = hero.id
    setNodes([])
    setEdges([])


    const filmsData = await Promise.all(hero.films.map((film) => fetchFilms(film)))
    const starshipsData = await Promise.all(hero.starships.map((starship) => fetchStarship(starship)))
    const validFilmsData = filmsData.filter(film => film && film.id);
    const validStarshipsData = starshipsData.filter(starship => starship && starship.id); 
  

    const filmEdges = validFilmsData.map((film, index) => ({
      id: `${heroId}-${film.id}-${index}`,
      source: `hero-${heroId}`, 
      target: `film-${film.id}`,
    }))
  

    const starshipEdges = validFilmsData.flatMap((film, filmIndex) => {
      const associatedStarships = validStarshipsData.filter(starship => film.starships.includes(starship.id))
      return associatedStarships.map((starship) => ({
        id: `film-${film.id}-starship-${starship.id}`,
        source: `film-${film.id}`,
        target: `starship-${starship.id}`,
      }))
    })
  
    setNodes((nds) => [
      ...nds,
      { id: `hero-${heroId}`, data: { label: hero.name }, position: { x: 50, y: 100 } }, 
      ...validFilmsData.map((film, index) => ({
        id: `film-${film.id}`,
        data: { 
          label: (
            <div style={{ whiteSpace: 'pre-line' }}>
              {`Название: ${film.title}\nДата выхода: ${film.release_date}`}
            </div>
          )
        },
        position: { x: 300, y: 100 + index * 100 }
      })),
      ...validStarshipsData.map((starship, index) => ({
        id: `starship-${starship.id}`, 
        data: { label: 
          <div style={{ whiteSpace: 'pre-line' }}>
              {`Название: ${starship.name} \n Модель: ${starship.model}`}
            </div>
         }, 
        position: { x: 550, y: 100 + index * 100 },
      })),
    ])
  
    setEdges((eds) => [...eds, ...filmEdges, ...starshipEdges])
  }



  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  )

  useEffect(() => {
    const fetchHeroes = async () => {
      try {
        const response = await fetch(url)
        const data = await response.json()
        setHeroes(data.results)
        setPages({previousPage: data.previous, nextPage: data.next})
      } catch (error) {
        console.error('Ошибка при получении персонажей:', error)
      }
    }
    fetchHeroes()
  }, [url])

  return (
    <div style={{ display: 'flex' }}>
      <div className='personBlock'>
        <h2>Список героев</h2>
        <ul>
          {heroes.map(hero => (
            <li key={hero.name} onClick={() => handleHeroClick(hero)}  className={activeHero === hero.name ? 'active' : ''}>
              -{hero.name}
            </li>
          ))}
        </ul>
        <div className='buttons'>
          <button onClick={() => clickChangePage('previous')}>previus</button>
          <button onClick={() => clickChangePage('next')}>next</button>
        </div>

      </div>
      <div style={{ width: '70%', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
        >
          <Controls />
          <MiniMap />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  )
}
