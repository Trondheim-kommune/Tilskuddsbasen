"""added_budsjett_balanse_col

Revision ID: 4daefe401b0f
Revises: 77696845676
Create Date: 2014-11-24 09:39:28.235512

"""

# revision identifiers, used by Alembic.
revision = '4daefe401b0f'
down_revision = '77696845676'

from alembic import op
import sqlalchemy as sa


def upgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.add_column('tilskuddsordninger', sa.Column('budsjett_i_balanse', sa.Boolean(), nullable=True))
    ### end Alembic commands ###


def downgrade():
    ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('tilskuddsordninger', 'budsjett_i_balanse')
    ### end Alembic commands ###
