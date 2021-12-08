import './index.scss'
import React from 'react'
import Header from '../../components/Header'
import Container from '../../components/Container'

function Index() {
	return (
		<div className="home">
			<Header />
			<Container>
				<div className="home-container">
					<div className="origami_bird_box">
						<div className="origami_bird">
							<div className="origami_bird_body">
								<div className="origami_bird_head"></div>
								<div className="origami_bird_wing_left">
									<div className="origami_bird_wing_left_top" />
								</div>
								<div className="origami_bird_wing_right">
									<div className="origami_bird_wing_right_top" />
								</div>
								<div className="origami_bird_tail_left"></div>
								<div className="origami_bird_tail_right"></div>
							</div>
						</div>
					</div>
				</div>
			</Container>
		</div>
	)
}

export default Index
