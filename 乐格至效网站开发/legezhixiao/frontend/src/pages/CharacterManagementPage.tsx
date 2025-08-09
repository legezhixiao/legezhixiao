import React from 'react'
import { useParams } from 'react-router-dom'
import CharacterManager from '../components/Writing/CharacterManager'

const CharacterManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div>项目ID无效</div>
  }

  return (
    <div style={{ padding: '0', height: '100vh', overflow: 'hidden' }}>
      <CharacterManager projectId={id} />
    </div>
  )
}

export default CharacterManagementPage
