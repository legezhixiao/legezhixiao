import React from 'react'
import { useParams } from 'react-router-dom'
import WorldBuildingManager from '../components/Writing/WorldBuildingManager'

const WorldBuildingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div>项目ID无效</div>
  }

  return (
    <div style={{ padding: '0', height: '100vh', overflow: 'hidden' }}>
      <WorldBuildingManager projectId={id} />
    </div>
  )
}

export default WorldBuildingPage
