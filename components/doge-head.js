
import { Canvas, useLoader, useFrame } from '@react-three/fiber'
import { React, Suspense, useRef, useState, useMemo } from 'react'
import { useGLTF, OrbitControls, rotation, ContactShadows, CameraShake } from '@react-three/drei'



function Model(props) {
  const group = useRef()
  const { nodes, materials } = useGLTF('/about-pictures/bread.gltf')
  useFrame(() => {
    group.current.rotation.y += 14;
    group.current.rotation.x += 1;
    group.current.rotation.z += -5;
  });
 

  return (
    <group ref={group} {...props} dispose={null}>
      <mesh
        castShadow
        receiveShadow
        geometry={nodes.bread.geometry}
        material={materials.Standard737373}
        position={[0, 0, 0]}
        scale ={7.5}
        rotation={[Math.PI / 2, 0, 0]}
      />
    
    </group>
  )
}

useGLTF.preload('/about-pictures/bread.gltf')

const DogeHead = () => {

  return (
    <div className="doggie shadow">
   <Canvas >
          
        <pointLight args={['red']} position={[10, 10, 10]} />
        <ambientLight position={[1, 0, 10]} args={['green']} intensity={0.5} />
        <spotLight position={[0, 0, -1]} args={['blue']} intensity={100}  />
        <ContactShadows />
        <Suspense fallback={null}>
        <Model position={1, 0, 0 }/>
        </Suspense>
       

          </Canvas>

    </div>
  )
}

export default DogeHead;
